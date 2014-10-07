/*
  ECMAScript implementation of "flatorize": Generate fast, flat,
  factorized ** ASM.JS code ** for mathematical expressions.

  Requires: ./flatorize.js
  
  Copyright 2014 Guillaume Lathoud
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
  http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  
  A copy of the Apache License Version 2.0 as of February 20th, 2013
  can be found in the file ./LICENSE.TXT
*/

// -*- coding: utf-8 -*-

/*global flatorize load console*/

if ('undefined' === typeof flatorize  &&  'function' === typeof load)
    load( 'flatorize.js' );  // e.g. V8

(function (global) {

    // First variant: optimize through post-processing (reordering)

    var INSERT_EARLY = true;
    var HEURISTIC_1  = true;
    
    // ---------- Public API

    flatorize.getAsmjsGen      = flatorize_getAsmjsGen;
    flatorize.getAsmjsImplCode = flatorize_getAsmjsImplCode;

    // ---------- Public API implementation
    
    function flatorize_getAsmjsGen( /*object*/cfg )
    // Returns a generator function that can be called to compile
    // asm.js code.
    //
    // Two usages:  
    // 
    // (1) In one shot, if `exprgen_fun` has no dependency, or all of them have been flatorized already
    // 
    // {{{
    // var asmjsGen = flatorize.getAsmjs( { name: "functionname", varstr: "a:float,b:[16 int]->c:float", exprgen: exprgen_fun } );
    // var buffer = new ArrayBuffer( 1 << 24 );
    // var f = asmjsGen( window, {}, buffer );  // Compile the asm.js code
    // // ...
    // f();  // call the asm.js code
    // // ...
    // }}}
    // 
    // (2) In two steps (useful if your expression has dependencies, esp. mutual dependencies):
    // 
    // {{{
    // var switcherfun = flatorize( "a:float,b:[16 int]->c:float", exprgen_fun );
    // // ...  the remaining dependencies of `exprgen_fun` can be flatorized here ...
    // 
    // // Now we have all flatorized all dependencies of `exprgen_fun`, so we can generate code
    // var asmjsGen = flatorize.getAsmjs( { name: "functionname", switcher: switcherfun } );
    // 
    // // ... usage of `asmjsGen`: as above.
    // }}}
    //
    // glathoud@yahoo.fr
    {
        var topFunName = cfg.name;   // Mandatory
        topFunName.substring.call.a;  // Cheap assert: Must be a string

        var js_switcher = cfg.switcher  ||  flatorize( cfg.varstr, cfg.exprgen );  // Two variants
        js_switcher.call.a;  // Cheap assert: Must be a function
        
        var js_direct   = js_switcher.getDirect  ?  js_switcher.getDirect()  :  js_switcher
        
        ,  typed_in_var = js_direct.typed_in_var
        , typed_out_vartype = js_direct.typed_out_vartype
        
        ,   e           = js_direct.e
        ,   exprCache   = js_direct.exprCache
        ,   varnameset  = js_direct.varnameset
        ;
        
        console.log( 'xxx flatorize_asmjsGen js_direct:' );
        console.dir( js_direct );

        var common_array_btd = checkType( typed_in_var, typed_out_vartype );

        var idnum2type  = propagateType( js_direct );
        
        console.log( 'xxx flatorize_asmjsGen idnum2type:' );
        console.dir( idnum2type );
        
        return generateAsmjsGen( js_direct, idnum2type, topFunName, common_array_btd );
    }

    function flatorize_getAsmjsImplCode( /*object*/cfg )
    // Convenience wrapper for:
    // {{{
    // flatorize.getAsmjsGen( cfg ).implCode;
    // }}}
    // 
    // Input: `cfg`: same as `flatorize.getAsmjsGen` (documented
    // there).
    // 
    // Output: a string containing the code for the asm.js
    // implementation.
    //
    //
    // glathoud@yahoo.fr
    {
        return flatorize_getAsmjsGen( cfg ).implCode;
    }
    
    // ---------- Private details ----------

    var _emptyObj = {};

    function checkType( typed_in_var, typed_out_vartype )
    {
        var array_basictype_set = {}
        ,   array_basictype_n   = 0

        ,   ret
        ;

        for (var k in typed_in_var)  {  if(!(k in _emptyObj)) {  // More flexible than hasOwnProperty
            check_one_type( typed_in_var[ k ] );
        }}

        check_one_type( typed_out_vartype );

        return ret;

        function check_one_type( t )
        {
            if ('string' === typeof t)
                return;
            
            if (t instanceof Array)
            {
                var bt = flatorize.tryToGetArrayBasicTypeDescription( t );
                if (!bt)
                    throw new Error( 'Unsupported!' );

                if (bt.type in array_basictype_set)
                    return;

                if (array_basictype_n)
                    throw new Error( 'Only one basic type permitted!' );

                array_basictype_set[ bt.type ] = 1;
                array_basictype_n++;

                ret = bt;
            }
            else
            {
                throw new Error( 'Unsupported!' );
            }
            
        }
    }



    // xxx when it works, remove the unused local vars in propagateType and generateCodeC

    var CODE2STR_CFG_ID  = '__code2str_cfg_id' // xxx link to flatorize.js in a more principled way
    ,   CODE2STR_CACHE   = 'STAT'              // xxx link to flatorize.js in a more principled way
    
    ,   _EXPR_IDNUM  = '__exprIdnum__'
    ,   _EXPR_ISEXPR = '__isExpr__'
    ;
    
    function propagateType( /*object e.g. `js_direct`*/info, /*?object?*/input_idnum2type )
    {
        // Input

        var typed_in_var      = info.typed_in_var
        
        ,   exprCache         = info.exprCache
        ,   idnum2expr        = exprCache.idnum2expr
        
        ,   out_e             = info.e
        ,   typed_out_vartype = info.typed_out_vartype

        ,   out_e_isExpr   = out_e.__isExpr__
        ,   out_e_isArray  = out_e instanceof Array
        ,   out_e_isNumber = typeof out_e === 'number' 

        // Output

        ,   isTop      = !input_idnum2type
        ,   idnum2type = input_idnum2type  ||  {}
        ;
        
        // Check

        (typed_out_vartype.substring  ||  typed_out_vartype.concat).call.a;   // must be a string or an array

        // Determine the type of `out_e`

        if (out_e_isExpr)
        {
            var idnum = out_e[ _EXPR_IDNUM ];
            idnum.toPrecision.call.a;  // Must be a number

            idnum2type[ idnum ] = typed_out_vartype;
        }
        else if (out_e_isArray)
        {
            if (isTop  &&  !(typed_out_vartype instanceof Array))
                throw new Error( '(top) `out_e` and `typed_out_vartype` must be consistent!' );
        }
        else if (out_e_isNumber)
        {
            idnum2type[ idnum ] = out_e === out_e | 0  ?  'int'  :  'float';
        }
        else
        {
            out_e.substring.call.a;  // Must be a string
            return;
        }

        // Recurse
        
        if (out_e_isExpr  ||  out_e_isArray)
        {
            for (var n = out_e.length, i = 0; i < n; i++)
            {
                var e_i    = out_e[ i ]
                ,   e_info = {

                    typed_in_var : typed_in_var
                    , exprCache  : exprCache

                    , e                 : e_i
                    , typed_out_vartype : out_e_isExpr  ?  typed_out_vartype  :  out_e_isArray  ?  typed_out_vartype[ i ]  :  /*error*/null
                }
                ;
                propagateType( e_info, idnum2type );
            }
        }
        
        // Done

        return idnum2type;
    }


    var _JS_CODE = '__code2str_cache_cfgSTAT';

    function generateAsmjsGen( /*object*/info, /*object*/idnum2type, /*string*/topFunName, /*?object?*/common_array_btd )
    // Returns a `gen` function that can be called to compile the
    // asm.js code, e.g.
    // 
    // {{{
    // var o = gen( window, {}, heap );  // compile the asm.js code
    // 
    // // Use it:
    // var result = o[ topFunName ]( some, input, parameters );
    // }}}
    //
    // `o[ topFunName ]` may also modify the heap in-place,
    // in which case you have to write inputs and read outputs
    // through the heap.
    //
    // For more examples of use see ./asmjs.html
    // 
    // glathoud@yahoo.fr
    {
        // Some of the `info` fields are only required at the top
        // level (`topFunName` given, i.e. `isTop === true`).

        var typed_in_var      = info.typed_in_var
        ,   untyped_vararr   = info.untyped_vararr
        
        ,   exprCache         = info.exprCache
        ,   idnum2expr        = exprCache.idnum2expr
        ,   idnum2usage       = exprCache.idnum2usage

        ,   duplicates         = info.duplicates
        ,   dupliidnum2varname = info.dupliidnum2varname
        
        ,   out_e             = info.e
        ,   typed_out_varname = info.typed_out_varname
        ,   typed_out_vartype = info.typed_out_vartype

        ,   isTop             = !!topFunName
        
        ,   before = []
        ,   body   = []
        ,   after  = []

        ,   cat = common_array_btd  &&  common_array_btd.type
        ,   cat_js = cat === 'int'  ?  'Int32'
            :  cat === 'float'  ?  'Float32'
            :  cat === 'double'  ?  'Float64'
            : (null).unsupported
        
        ,   cat_bits  = /\d+$/.exec( cat_js )|0
        ,   cat_bytes = cat_bits >> 3
        
        ,   cat_varname = cat_js.toLowerCase()  // xxx make sure not in duplicates, else change cat_varname's value a bit (impl: use flatorize.xxx())

        ,   simple_in_vararr = untyped_vararr.filter( function (name) { return 'string' === typeof this[ name ]; }, typed_in_var )
        ,   array_in_vararr  = untyped_vararr.filter( function (name) { return 'string' !== typeof this[ name ]; }, typed_in_var )

        ,   count = 0
        ,   array_name2info   = {}
        ,   array_in_vararr_info = array_in_vararr.map( name_2_info_side, typed_in_var )

        ,   bt_out = flatorize.tryToGetArrayBasicTypeDescription( typed_out_vartype )

        ,   asmjs_buffer_bytes = Math.ceil( count * cat_bytes / (1 << 24) ) << 24
        ;
        
        if (bt_out)
        {
            var tmp = {};
            tmp[ typed_out_varname ] = typed_out_vartype;
            name_2_info_side.call( tmp, typed_out_varname );
        }

        function name_2_info_side(name) 
        {
            var bt = flatorize.tryToGetArrayBasicTypeDescription( this[ name ] )
            ,  ret = Object.create( bt )
            ;
            ret.name  = name;
            ret.begin = count;
            ret.begin_bytes = ret.begin * cat_bytes;
            count += ret.n;
            ret.end   = count;

            ret.matchFun = matchFun;

            array_name2info[ name ] = ret;
            
            return ret;

            function matchFun( e )
            {
                if (e instanceof Object  &&  e.part)
                {
                    var ind_arr = [];
                    
                    for (var d = bt.dim; d--;)
                    {
                        if (e.part)
                        {
                            var ind = e.part.where;
                            if (!(ind.toPrecision  &&  ind.toPrecision.call))
                                null.unsupported; // Must be a number
                            
                            ind_arr.unshift( ind );
                            
                            var epx = e.part.x;

                            if (epx === name)
                            {
                                var partial = d > 0
                                ,   ret = { 
                                    partial     : partial
                                    , missing_d : d
                                }
                                ;
                                if (!partial)
                                    ret.flat_ind = bt.flatIndFun( ind_arr );
                                    
                                return ret;
                            }
                            else if (epx instanceof Object)
                            {
                                e = epx;
                                continue;
                            }
                        }
                    }
                }
                return false;
            }
        }

        
        if (isTop)
        {
            before = funDeclCodeAsmjs( simple_in_vararr, typed_in_var, topFunName ).concat(
                [ 
                    '{'
                ]
            );
         
            body = funBodyCodeAsmjs( bt_out, typed_out_varname, typed_out_vartype, out_e, idnum2type, idnum2expr, duplicates, dupliidnum2varname, array_name2info, cat_varname )
            
            after = [ 
                , '}' 
            ];

            wrap = [ '', 'return { ' + topFunName + ' : ' + topFunName + ' };' ];
        }
        else
        {
            
        }
        
        // ---------- asm.js wrapper generator ----------

        var gen = new Function(
            'stdlib', 'foreign', 'heap',
            [ 
                '/* code generated by flatorize.asmjsGen.js */'
                , '"use asm";'
                , ''
                , cat_varname  ?  'var ' + cat_varname + ' = new stdlib.' + cat_js + 'Array( heap );'  :  '' 
                , ''
            ]
                .concat( before
                         .concat( body )
                         .concat( after )
                       )
                .concat( wrap )
                .map( function (line) { return '  ' + line; } )
                .join( '\n' )
        );

        gen.implCodeArr = before.concat( body ).concat( after );
        gen.implCode    = gen.implCodeArr.join( '\n' );
        
        gen.count = count;
        gen.cat_bits = cat_bits;
        gen.cat_bytes = cat_bytes;
        gen.buffer_bytes = asmjs_buffer_bytes;

        gen.array_name2info = array_name2info;

        gen.TypedArray = global[ cat_js + 'Array' ];  // Constructor function, e.g. Float64Array

        return gen;
    }


    function funDeclCodeAsmjs( simple_in_vararr, typed_in_var, topFunName )
    // Returns an array of codeline strings.
    {
        return [
            'function ' + topFunName + '( ' + simple_in_vararr.join( ', ' ) + ' )'
        ].concat(
            simple_in_vararr.map( function (name) {

                var t = typed_in_var[ name ];

                if (t === 'float'  ||  t === 'double')
                    return 'name = +' + name + ';';

                if (t === 'int')
                    return 'name = ' + name + '|0';

                (null).unsupported;
            })
        );
    }

    function funBodyCodeAsmjs( bt_out, typed_out_varname, typed_out_vartype, out_e, idnum2type, idnum2expr, duplicates, dupliidnum2varname, array_name2info, cat_varname )
    // Returns an array of codeline strings.
    {
        var is_out_type_simple = 'string' === typeof typed_out_vartype
        ,   ret = [ ]
	,   type2numberstring2constantname = {}
        ,   constantname2declcode = {}
	,   constantnameArr = []
        ;
        
        // ---- asm.js support for multidimensional arrays: flatten the access
        // i.e. assuming `a` is a 3x4 matrix, `a[1][2]` becomes e.g. `float64[1*3+2]`

        var o = flatten_duplicates( duplicates, idnum2expr, array_name2info, bt_out.type, cat_varname );

        duplicates = o.duplicates;
        idnum2expr = o.idnum2expr;
        

        // ---- asm.js "type" declarations

        ret.push( '/* Intermediary calculations: asm.js "type" declarations */' );

        for (var n = duplicates.length, i = 0; i < n; i++)
        {
            var idnum  = duplicates[ i ]
            ,   d_e    = idnum2expr[ idnum ]
            ,   d_type = idnum2type[ idnum ]
            ,   d_name = dupliidnum2varname[ idnum ]
            ;
            d_type.substring.call.a;  // Must be a simple type
            ret.push( 
                'var ' + d_name + ' = ' + (
                    d_type === 'float'  ||  d_type === 'double'   ?  '0.0'
                        : d_type === 'int'  ?  '0'
                        : (null).unsupported
                ) + ';'
            );
        }
        
        // ---- Intermediary calculations

        if (!INSERT_EARLY)
            ret.push( '/* Intermediary calculations: implementation */' );

        for (var n = duplicates.length, i = 0; i < n; i++)
        {
            var idnum  = duplicates[ i ]
            ,   d_e    = idnum2expr[ idnum ]
            ,   d_type = idnum2type[ idnum ]
            ,   d_name = dupliidnum2varname[ idnum ]
            ;
            d_type.substring.call.a;  // Must be a simple type
            ret.push
            (
                (function (s, e) {
                    return complete_with_dependency_information
                    ( 
                        { toString : function () { return s; }, idnum : idnum }
                        , e
                    );
                })( 
                    d_name + ' = ' + expcode_cast_if_needed( d_type, d_e, d_name ) + ';'
                    , d_e
                )
            );
        }
        
        // Return

        if (!INSERT_EARLY)
            ret.push( '', '/* output */' );

        if (is_out_type_simple)
        {
            // Use return

            null.xxx_return;
        }
        else
        {
            // Arrays: Do not use return
            
            var outvar_info  = array_name2info[ typed_out_varname ]
            , outvar_begin = outvar_info.begin
            ;
            outvar_begin.toPrecision.call.a;

            var basictype = bt_out.type;
            (basictype || 0).substring.call.a;  // Must be a string

            outarray_code_push_recursive( out_e );
        }
        
	var constantdeclcode = [];
	for (var n = constantnameArr.length
	     , i = 0; i < n; i++
	    )
	    constantdeclcode.push( constantname2declcode[ constantnameArr[ i ] ] )
	;
	
	
	if (constantdeclcode.length)
	    constantdeclcode.push('');  // Insert an empty line after constants declarations.

        return constantdeclcode.concat( ret ).map( indent );

        function outarray_code_push_recursive( arr, ind_arr )
        {
            arr.concat.call.a;

            ind_arr  ||  (ind_arr = []);

            var d = 1 + ind_arr.length
            , dim = outvar_info.dim
            ,   n = arr.length
            ;
            for (var i = 0; i < n; i++)
            {
                var arr_i = arr[ i ]
                ,   ia2   = ind_arr.concat( i )
                ;
                
                if (d < dim)
                {
                    outarray_code_push_recursive( arr_i, ia2 );
                }
                else
                {
                    var ind = outvar_info.begin + outvar_info.flatIndFun( ia2 )
                    ,  code = cat_varname + '[' + ind + '] = ' + expcode_cast_if_needed( basictype, arr_i ) + ';'
                    ;
                    
                    if (INSERT_EARLY)
                        insert_early( ret, arr_i, code );
                    else
                        ret.push( code );
                }
            }
        }
        
        function heuristic_proof_of_concept_reorder_a_bit_to_reduce_register_spill( arr )
        // Before we try a more general implementation, let us first
        // check whether this can bring performance at all.
        {
            var already = {};
            
            for (var i = arr.length - 1; i > 0;)
            {
                var co = arr[ i ]
                , ddsi = co.depSortedId
                , changed = false;
                ;
                if (ddsi  &&  !(ddsi in already))
                {
                    already[ ddsi ] = true;
                    for (var j = i-1; j >= 0; j--)
                    {
                        var aj = arr[ j ];
                        if (ddsi === aj.depSortedId  &&  i-j > 1)
                        {
                            arr.splice( j + 1, 0, arr.splice( i, 1 )[ 0 ] );
                            changed = true;
                            break;
                        }
                    }                    
                }
                if (!changed)
                    i--;
            }
            

        }

        function complete_with_dependency_information( codeObj, e )
        {
            var depSortedArr = get_depSortedArr( e );
            var ret = Object.create( codeObj );
            ret.depSortedArr = depSortedArr;
            ret.depSortedId  = depSortedArr.join( ',' );

            return ret;
        }

        function get_depSortedArr( e )
        {
            var depSortedArr = [];
            for (var n = e.length , i = 0; i < n; i++)
            {
                var ei = e[ i ];
                if (ei.__isExpr__)
                {
                    var idnum = ei.__exprIdnum__;
                    idnum.toPrecision.call.a;  // Must be a number

                    if (idnum in dupliidnum2varname)
                        depSortedArr.push( idnum );
                    else
                        depSortedArr.push.apply( depSortedArr, get_depSortedArr( ei ) );
                }
            }
            depSortedArr.sort( function (a,b) { return a < b  ?  -1  :  +1; } );
            return depSortedArr;
        }

        function insert_early( ret, e, code )
        // Assumption: expr id num increases bottom-up with the
        // construction (construct id num > all idnums of construct's
        // dependencies).
        {
            var max = -Infinity;
            for (var k = e.length; k--;)
            {
                var ek = e[ k ];
                if (ek.__isExpr__)
                    max = Math.max( max, ek.__exprIdnum__ );
            }
            
            for (var n = ret.length, i = 0; i < n; i++)
            {
                if (ret[ i ].idnum > max)
                {
                    ret.splice( i, 0, code );
                    return;
                }
            }
            
            ret.push( code );
        }

        function expcode_cast_if_needed( outtype, e, /*?string?*/outname )
        {
            var etype  = idnum2type[ e[ _EXPR_IDNUM ] ]
            ,   jscode = e[ _JS_CODE ]
            ;
            if (jscode === outname  ||  !outname)
            {
                // e.g. intermediary value
                
                var toe = typeof e;

                if ('number' === toe)
                    return '' + e;
                
                if ('string' === toe)
                    return e;
                
                else if (e.length === 1  &&  'string' === typeof e[ 0 ])
                {
                    jscode = e[ 0 ];
                }
                else
                {
                    var opt    = { 
                        dupliidnum2varname: dupliidnum2varname
                        , duplicates : duplicates
                    };
                    
                    var topopt = { 
                        do_not_cache: true
                        , no_paren: true
                    };
                    
                    var modified_e = e.map( modify_input_access );

                    jscode = e.__toStr__.call( modified_e, opt, topopt );
                }
            }

            return outtype === 'float'  ||  outtype === 'double'  ?  '+(' + jscode + ')'
                :  outtype === 'int'  ? '(' + jscode + ')|0'
                :  null.unsupported
            ;

            function modify_input_access( one )
            {
                var part = one.part;
                
                if (part)
                {
                    var   x = part.x
                    , where = part.where

                    , info = 'string' === typeof x  &&  array_name2info[ x ]
                    ;
                    if (info)
                    {
                        where.toPrecision.call.a;

                        var s = cat_varname + '[' + (info.begin + where)+ ']';

                        return outtype === 'float'  ||  outtype === 'double'  ?  '+' + s 
                            :  outtyoe === 'int'  ?  '(' + s + ')|0'
                            :  null.unsupported
                        ;
                        
                    }
                }

                var tof_one = typeof one
                , is_one_o  = 'object' === tof_one
                , is_one_expr = is_one_o  &&  one[ _EXPR_ISEXPR ]

                ,        idnum = is_one_expr  &&  one  &&  one[ _EXPR_IDNUM ]
                , duplivarname = idnum  &&  dupliidnum2varname[ idnum ]
                ;
                if (duplivarname)
                    return duplivarname;

                if (is_one_expr)
                    return one.__toStr__.call( one.map( modify_input_access ), opt, topopt );

                return one;
            }
        }

        function indent( s )
        {
            return '  ' + s;
        }

    }







    
    function arr2set( arr )
    {
        for (var ret = {}, i = arr.length; i--;)
            ret[arr[ i ]] = 1;
        
        return ret;
    }



    function flatten_duplicates( duplicates, idnum2expr, array_name2info, bt_out_type, cat_varname )
    // ---- asm.js support for multidimensional arrays: flatten the access
    // i.e. assuming `a` is a 3x4 matrix, `a[1][2]` becomes e.g. `float64[1*3+2]`
    //
    // Example:
    // {{{
    // var o = flatten_duplicates( duplicates, idnum2expr );
    //
    // duplicates = o.duplicates;
    // idnum2expr = o.idnum2expr;
    // }}}
    {
        (cat_varname || 0).substring.call.a;

        var new_duplicates = []
        ,   new_idnum2expr = {}
        ;
        duploop: for (var ndup = duplicates.length, i = 0; i < ndup; i++) 
        {
            var idnum = duplicates[ i ];
            idnum.toPrecision.call.a;
            
            var e = idnum2expr[ idnum ];

            if (e  &&  e.part)
            {
                for (var name in array_name2info) { if (!(name in _emptyObj)) {   // More flexible than hasOwnProperty
                    
                    var info = array_name2info[ name ]
                    ,   m    = info.matchFun( e )
                    ;
                    if (!m)
                        continue;
                    
                    // Found a matching `part` expression.
                    
                    if (m.partial)
                        continue duploop;  // Things like C's pointer `float*` don't go in asm.js -> flatten multidimensional arrays completely
                    
                    var ind = info.begin + m.flat_ind;
                    if (isNaN( ind )  ||  !(ind.toPrecision))
                        null.bug;
                    
                    e.length = 1;

                    var s = cat_varname + '[' + ind + ']';
                    e[ 0 ] = bt_out_type === 'double'  ||  bt_out_type === 'float'  ?  '+' + s
                        : bt_out_type === 'int'  ?  '(' + s + '|0)'
                        : null.unsupported
                    ;
                    e.part = { x : cat_varname, where : ind };
                    
                    new_duplicates.push( idnum );
                    new_idnum2expr[ idnum ] = e;
                    continue duploop;
                }}
                null.bug;  // Must find a match!
            }
            else
            {
                // Not a `part` expression
                // -> keep it as is
                new_duplicates.push( idnum );
                new_idnum2expr[ idnum ] = e;
            }
        }
        
        return {
            duplicates   : new_duplicates
            , idnum2expr : new_idnum2expr
        };
    }



    function get_idnum2needArrObj( idnum2expr, idnum2codeline )
    {
        var idnum2needArr = {}
        ,   idnum2needObj = {}
        ,   idnum2useline = {}
        ,   ret = { idnum2needArr   : idnum2needArr 
                    , idnum2needObj : idnum2needObj 
                    , idnum2useline : idnum2useline
                  }
        ;
        for (var idnum in idnum2expr) { if (!(idnum in ret)) {

            var     e = idnum2expr[ idnum ]
            , needArr = []
            , needObj = {}
            ;
            for (var i = e.length; i--;)
            {
                var ei = e[ i ];
                if (ei  &&  ei.__isExpr__)
                    update_needArr_needObj( ei, needArr, needObj, idnum2codeline );
            }
            
            idnum2needArr[ idnum ] = needArr;
            idnum2needObj[ idnum ] = needObj;

            if (idnum in idnum2codeline)
            {
                for (var n = needArr.length
                     , i = 0; i < n; i++)
                {
                    var nai = needArr[ i ];
                    (nai in idnum2useline  ?  idnum2useline[ nai ]  :  (idnum2useline[ nai ] = []))
                        .push( idnum )
                    ;
                }
                
            }
        }}
        return ret;
    }

    function update_needArr_needObj( e, needArr, needObj, idnum2codeline )
    {
        var e_idnum = e.__exprIdnum__
        ,   error
        ;
        if (e_idnum in idnum2codeline  &&  !(e_idnum in needObj))
        {
            needArr.push( e_idnum );
            needObj[ e_idnum ] = 1;
        }
        else
        {
            for (var n = e.length, i = 0; i < n; i++)
            {
                var ei = e[ i ];
                if (ei  &&  ei.__isExpr__)
                    update_needArr_needObj( ei, needArr, needObj, idnum2codeline );
            }
        }
    }
    
    function get_restArrSet( idnum2expr, idnum2codeline )
    {
        var restArr = []
        ,   restSet = {}
        ,   ret = { restArr : restArr, restSet : restSet }
        ;
        for (var k in idnum2codeline) { if (!(k in restSet)) {

            var idnum = idnum2expr[ k ].__exprIdnum__;
            idnum.toPrecision.call.a;  // Must be a number

            restArr.push( idnum );
            restSet[ idnum ] = 1;
        }}
        return ret;
    }
    
})(this);