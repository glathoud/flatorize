/*
  ECMAScript implementation of "flatorize": Generate fast, flat,
  factorized ** ASM.JS code ** for mathematical expressions.

  Requires: ./flatorize.js and ./flatorize_type_util.js
  
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

if ('undefined' === typeof flatorize.type_util  &&  'function' === typeof load)
    load( 'flatorize_type_util.js' );  // e.g. V8

(function (global) {

    var INSERT_OUTPUT_EARLY = true  // variant: optimize through post-processing (reordering)
    ,   FTU = flatorize.type_util
    ;

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
        
        // Difference with the C plugin: we do NOT allow heterogenous
        // types.  See also ./flatorize_c.js

        var common_array_btd = checkType( typed_in_var, typed_out_vartype );

        var idnum2type  = FTU.propagateType( js_direct );
        
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

            if (!t)
            {
                throw new Error( 'Type information is required to generate asm.js code!' );
            }
            else if (t instanceof Array)
            {
                var bt = FTU.tryToGetArrayBasicTypeDescription( t );
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


    var _EXPR_IDNUM  = '__exprIdnum__'
    ,   _EXPR_ISEXPR = '__isExpr__'
    ;
    
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
        ,   wrap   = []
        ;

        if (common_array_btd)
        {
            var cat = common_array_btd  &&  common_array_btd.type
            ,   cat_js = cat === 'int'  ?  'Int32'
                :  cat === 'float'  ?  'Float32'
                :  cat === 'double'  ?  'Float64'
                : (null).unsupported
            
            ,   cat_bits  = /\d+$/.exec( cat_js )|0
            ,   cat_bytes = cat_bits >> 3
            
            ,   cat_varname = cat_js.toLowerCase()  // xxx make sure not in duplicates, else change cat_varname's value a bit (impl: use flatorize.xxx())
            ;
        }
        else
        {
            // Dealing with scalars only
        }
        

        var simple_in_vararr = untyped_vararr.filter( function ( name ) { return 'string' === typeof this[ name ]; }, typed_in_var )
        ,   array_in_vararr  = untyped_vararr.filter( function ( name ) { return 'string' !== typeof this[ name ]; }, typed_in_var )

        ,   arraynametype    = array_in_vararr.map( function ( name ) { 
            return { 
                name   : name
                , type : typed_in_var[ name ] 
            }; 
        } )
        
        ,   bt_out = FTU.tryToGetArrayBasicTypeDescription( typed_out_vartype )
        ;
        if (bt_out)
        {
            // Difference with the C plugin: (in the array case) input
            // array and output array types must all share the same
            // basic type.
            if (cat  &&  cat !== bt_out.type)
                throw new Error('input & output basic types must be identical (e.g. all "double").')
            
            arraynametype.push( { 
                name   : typed_out_varname
                , type : typed_out_vartype 
            } );
        }

        var state = { count : 0, array_name2info : {} };
        
        arraynametype.forEach( FTU.name_2_info_side, state )
        
        var count              = state.count
        ,   array_name2info    = state.array_name2info

        ,   asmjs_buffer_bytes = Math.ceil( count * cat_bytes / (1 << 24) ) << 24
        ;
        
        if (isTop)
        {
            before = funDeclCodeAsmjs( simple_in_vararr, typed_in_var, topFunName );
         
            body = funBodyCodeAsmjs( bt_out, typed_out_varname, typed_out_vartype, out_e, idnum2type, idnum2expr, duplicates, dupliidnum2varname, array_name2info, cat_varname, common_array_btd )
            
            after = [ '}' ];

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
            , '{'
        ].concat(
            simple_in_vararr.map( function (name) {

                var t = typed_in_var[ name ];

                if (t === 'float'  ||  t === 'double')
                    return name + '= +' + name + ';';

                if (t === 'int')
                    return name + '= ' + name + '|0;';

                (null).unsupported;
            })
        );
    }

    function funBodyCodeAsmjs( bt_out, typed_out_varname, typed_out_vartype, out_e, idnum2type, idnum2expr, duplicates, dupliidnum2varname, array_name2info, cat_varname, common_array_btd )
    // Returns an array of codeline strings.
    {
        var is_out_type_simple = 'string' === typeof typed_out_vartype
        ,   ret = [ ]
        ,   ret_idnumSet = {}
        ,   ret_idnumMax = -Infinity

        ,   idnum2max_in_ret_subset = {}  // cache for speedup
        ;
        
        // ---- asm.js support for multidimensional arrays: flatten the access
        // i.e. assuming `a` is a 3x4 matrix, `a[1][2]` becomes e.g. `float64[1*3+2]`

        if (cat_varname)
        {
            var single_common_array = common_array_btd  &&  {
                name   : cat_varname
                , type : common_array_btd.type
            }
            ,   o = FTU.flatten_duplicates( duplicates, idnum2expr, array_name2info, castwrap, single_common_array )
            ;
            
            duplicates = o.duplicates;
            idnum2expr = o.idnum2expr;
        }
        
        // ---- asm.js "type" declarations

        var n = duplicates.length;

        if (n)
            ret.push( '/* Intermediary calculations: asm.js "type" declarations */' );

        for (var i = 0; i < n; i++)
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
        if (n)
            ret.push( '' );

        // ---- Intermediary calculations

        if (!INSERT_OUTPUT_EARLY)
            ret.push( '/* Intermediary calculations: implementation */' );

        for (var n = duplicates.length, i = 0; i < n; i++)
        {
            var idnum  = duplicates[ i ]
            ,   d_e    = idnum2expr[ idnum ]
            ,   d_type = idnum2type[ idnum ]
            ,   d_name = dupliidnum2varname[ idnum ]
            ;
            d_type.substring.call.a;  // Must be a simple type
            ret_push_nonString(
                idnum
                , (function (s, e) {
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

        if (!INSERT_OUTPUT_EARLY)
            ret.push( '', '/* output */' );

        if (is_out_type_simple)
        {
            // Use return

            ret.push( 'return ' + expcode_cast_if_needed( typed_out_vartype, out_e ) + ';' );
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
        
        return ret.map( indent );

        function ret_push_nonString( idnum, x )
        {
            if ('string' === typeof x)
                null.bug;
            
            ret.push( x );
            ret_idnumSet[ idnum ] = 1;
            ret_idnumMax = Math.max( ret_idnumMax, idnum );
        }
        
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
                    
                    if (INSERT_OUTPUT_EARLY)
                        insert_output_early( ret, arr_i, code );
                    else
                        ret.push( code );
                }
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

        function insert_output_early( ret, e, code )
        // Assumption: expr id num increases bottom-up with the
        // construction (construct id num > all idnums of construct's
        // dependencies).
        //
        // Goal: reduce register spill by using intermediary variables
        // as soon as possible == write the related output lines as
        // early as possible.
        {
            var max = max_in_ret_subset( e );
            
            if (max < ret_idnumMax)
            {
                for (var n = ret.length, i = n; i--;)
                {
                    if (ret[ i ].idnum <= max)
                    {
                        ret.splice( i + 1, 0, code );
                        return;
                    }
                }
            }
            
            ret.push( code );
        }

        function max_in_ret_subset( e )
        // Recursive deep evaluation of the maximum expression id used
        // in `e` that is within the subset of already "written"
        // intermediary code.
        //
        // Return -Infinity or an integer `idnum`.
        {
            var tmpMax = -Infinity;
            
            if (e.__isExpr__)
            {
                var e_idnum = e.__exprIdnum__;
                if (e_idnum != null)
                {
                    if (e_idnum in ret_idnumSet)
                        return e_idnum;

                    if (e_idnum in idnum2max_in_ret_subset)
                        return idnum2max_in_ret_subset[ e_idnum ];

                    for (var k = e.length; k--;)
                    {
                        var    ek = e[ k ];
                        if (ek.__isExpr__)
                        {
                            var idnum = ek.__exprIdnum__;
                            idnum.toPrecision.call.a;
                            
                            if (idnum in ret_idnumSet)
                            {
                                if (idnum > tmpMax)
                                    tmpMax = idnum;
                            }
                            else
                            {
                                tmpMax = Math.max( tmpMax, max_in_ret_subset( ek ) );
                            }
                        }
                    }

                    idnum2max_in_ret_subset[ e_idnum ] = tmpMax;
                }
            }
            
            return tmpMax;
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
                {
                    jscode = '' + e;
                }
                else if ('string' === toe)
                {
                    jscode = e;
                }
                else if (!e.part  &&  e.length === 1  &&  'string' === typeof e[ 0 ])
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
                    
                    var modified_e = modify_input_access( e );

                    jscode = 'string' === typeof modified_e  ?  modified_e  :  e.__toStr__.call( modified_e, opt, topopt );
                }
            }

            return FTU.castwrap_spare( castwrap, outtype, jscode );

            function modify_input_access( one )
            {
                var idnum;
                if (one.__isExpr__  &&  (idnum = one.__exprIdnum__) != null  &&  idnum in ret_idnumSet)
                {
                    var dupli_varname = dupliidnum2varname[ idnum ];
                    (dupli_varname  ||  0).substring.call.a;
                    return dupli_varname;
                }
                

                var part = one.part;
                
                if (part)
                {
                    for (var name in array_name2info) { if (!(name in _emptyObj)) {   // More flexible than hasOwnProperty
                    
                        var info = array_name2info[ name ]
                        ,   m    = info.matchFun( one )
                        ;
                        if (!m)
                            continue;
                        
                        // Found a matching `part` expression.
                        
                        if (m.partial)
                            null.bug_or_error;  // Things like C's pointer `float*` don't go in asm.js -> flatten multidimensional arrays completely
                    
                        var ind = info.begin + m.flat_ind;
                        if (isNaN( ind )  ||  !(ind.toPrecision))
                            null.bug;

                        var s = cat_varname + '[' + ind + ']';

                        return FTU.castwrap_spare( castwrap, outtype, s );
                    }}
                }
                
                var tof_one = typeof one
                , is_one_o  = 'object' === tof_one
                , is_one_expr = is_one_o  &&  one[ _EXPR_ISEXPR ]
                ;

                var      idnum = is_one_expr  &&  one  &&  one[ _EXPR_IDNUM ]
                , duplivarname = idnum  &&  idnum in ret_idnumSet  &&  dupliidnum2varname[ idnum ]
                ;
                if (duplivarname)
                    return duplivarname;
                
                if (is_one_expr)
                    return one.__toStr__.call( one.map( modify_input_access ), opt, topopt );

                if (tof_one === 'number')
                    return FTU.castwrap_spare( castwrap, outtype, '' + one );
                
                return one;
            }
        }

        function indent( s )
        {
            return '  ' + s;
        }

    }


    function castwrap( /*string*/type, /*string*/code)
    {
        return type === 'double'  ||  type === 'float'  ?  '+(' + code + ')'
            : type === 'int'  ?  '((' + code + ')|0)'
            : null.unsupported
        ;
    }
   
    function arr2set( arr )
    {
        for (var ret = {}, i = arr.length; i--;)
            ret[arr[ i ]] = 1;
        
        return ret;
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
