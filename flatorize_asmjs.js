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

(function () {

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
    ;
    
    function typeIsArraySametype( typedecl )
    {
        return typedecl instanceof Array  &&  typedecl.sametype;
    }

    var _EXPR_IDNUM = '__exprIdnum__';
    
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
        
        ,   cat_varname = cat_js.toLowerCase()

        ,   simple_in_vararr = untyped_vararr.filter( function (name) { return 'string' === typeof this[ name ]; }, typed_in_var )
        ,   array_in_vararr  = untyped_vararr.filter( function (name) { return 'string' !== typeof this[ name ]; }, typed_in_var )

        ,   count = 0
        ,   array_name2info   = {}
        ,   array_in_vararr_info = array_in_vararr.map( name_2_info_side, typed_in_var )

        , bt_out = flatorize.tryToGetArrayBasicTypeDescription( typed_out_vartype )
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
            count += ret.n;
            ret.end   = count;

            array_name2info[ name ] = ret;
            
            return ret;

        }

        
        if (isTop)
        {
            before = funDeclCodeAsmjs( simple_in_vararr, typed_in_var, topFunName ).concat(
                [ 
                    , '/* code generated by flatorize_asmjsGen.js */'
                    , '{'
                ]
            );
         
            body = funBodyCodeAsmjs( typed_out_varname, typed_out_vartype, out_e, idnum2type, idnum2expr, duplicates, dupliidnum2varname )
            
            after = [ 
                , '}' 
            ];

            wrap = [ 'return { ' + topFunName + ' : ' + topFunName + ' };' ];
        }
        else
        {
            
        }
        
        // ---------- asm.js wrapper generator ----------

        var gen = new Function(
            'stdlib', 'foreign', 'heap',
            [ 
                cat_varname  ?  'var ' + cat_varname + ' = new stdlib.' + cat_js + 'Array( heap );'  :  '' 
            ]
                .concat( before )
                .concat( body )
                .concat( after )
                .concat( wrap )
                .join( '\n' )
        );

        gen.implCodeArr = before.concat( body ).concat( after );
        gen.implCode    = gen.implCodeArr.join( '\n' );
        
        xxx 
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

    function funBodyCodeAsmjs( typed_out_varname, typed_out_vartype, out_e, idnum2type, idnum2expr, duplicates, dupliidnum2varname )
    // Returns an array of codeline strings.
    {
        var is_out_type_simple = 'string' === typeof typed_out_vartype
        ,   ret = [ ]
	,   type2numberstring2constantname = {}
        ,   constantname2declcode = {}
	,   constantnameArr = []
        ;
        
        xxx DOCH INSERT_EARLY and simple optimi (just not HEURISTIC_2)

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
                    d_type + ' ' + d_name + ' = ' + expcode_cast_if_needed( d_type, d_e, d_name ) + ';'
                    , d_e
                )
            );
        }
        
        xxx

        // Return

        if (!INSERT_EARLY)
            ret.push( '', '/* output */' );

        if (is_out_type_simple)
        {
            // Use return

            'xxx return'
        }
        else
        {
            // Do not use return
            
            var is_level_1, basictype;
            
            if (
                typeIsArraySametype( typed_out_vartype )  &&  
                    (
                        (is_level_1 = 'string' === typeof (basictype = typed_out_vartype[ 0 ]))  ||  
                            (typeIsArraySametype( typed_out_vartype[ 0 ] )  &&  'string' === typeof (basictype = typed_out_vartype[ 0 ][ 0 ]))
                    )
            )
            {
                var n = typed_out_vartype.length
                ,   p = !is_level_1  &&  typed_out_vartype[ 0 ].length
                ;
                basictype.substring.call.a;  // Must be a string

                if (ALIGNED_DATA)
                {
                    var outptr = '__outptr__'; // xxx check against "duplicates" varnames to prevent collision.
                    ret.unshift( basictype + '*' + outptr + ' = ' + typed_out_varname + '[0];' );
                }
                
                
                for (var i = 0; i < n; i++)
                {
                    if (is_level_1)
                    {
                        var ei = out_e[ i ]
                        // xxx , assign = ALIGNED_DATA  ?  
                        , code = typed_out_varname + '[' + i + '] = ' + expcode_cast_if_needed( basictype, out_e[ i ] ) + ';'
                        ;
                        if (INSERT_EARLY)
                            insert_early( ret , ei ,  code );
                        else
                            ret.push( code );
                    }
                    else
                    {
                        for (var j = 0; j < p; j++)
                        {
                            var eij = out_e[ i ][ j ]

                            , assign = ALIGNED_DATA 
                                ? outptr + '[' + ( p * i + j ) + ']'
                                : typed_out_varname + '[' + i + ']' + '[' + j + ']'

                            ,  code = assign + ' = ' + expcode_cast_if_needed( basictype, eij ) + ';' 
                            ,  codeObj = 
                                (function (s, e)
                                 {
                                     return complete_with_dependency_information(
                                         { toString : function () { return s; } }
                                         , e
                                     );
                                 })
                            (
                                code
                                , eij
                            )
                            ;
                            
                            if (INSERT_EARLY)
                                insert_early( ret , eij , codeObj );
                            else
                                ret.push( codeObj );
                        }

                    }
                }

                if (!is_level_1  &&  HEURISTIC_1)
                    heuristic_proof_of_concept_reorder_a_bit_to_reduce_register_spill( ret );
            }
            else
            {
                throw new Error( 'funBodyCodeC: vartype not supported yet.' );
            }
            
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
            if (jscode === outname)
            {
                // e.g. intermediary value
                
                var toe = typeof e;

                if ('number' === toe)
                    return CONSTANT_VAR  ?  code_replace_numberstring_with_constant( outtype, '' + e )  :  '' + e;
                
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
			, code_replace_numberstring_with_constant : CONSTANT_VAR && function (numberstring) { return code_replace_numberstring_with_constant( outtype, numberstring ); }
                    };
                    
                    var topopt = { 
                        do_not_cache: true
                        , no_paren: true
                    };
                    
                    jscode = e.__toStr__( opt, topopt );
                }
            }

            return outtype === etype  ?  jscode  :  '(' + outtype + ')(' + jscode + ')';
        }

        function indent( s )
        {
            return '  ' + s;
        }

	function code_replace_numberstring_with_constant( outtype, numberstring )
	// Goal: share constants.
	{
	    (numberstring || null).substring.call.a;  // Must be a non-empty string

	    var numberstring2constantname = outtype in type2numberstring2constantname 
		? type2numberstring2constantname[ outtype ]
		: (type2numberstring2constantname[ outtype ] = {})
	    ;
	    
	    if (numberstring in numberstring2constantname)
		return numberstring2constantname[ numberstring ];

	    var constantname = outtype.toUpperCase() + '_' + 
		numberstring.replace( /-/g, 'm' )
		.replace( /\./g, '_' )
		.replace( /\+/g, '+' )
	    ;
	    if (constantname in constantname2declcode)
		throw new Error('bug');

	    constantname2declcode[ constantname ] = 'const ' + outtype + ' ' + constantname + ' = ' + numberstring + ';';
	    constantnameArr.push( constantname );
	    return numberstring2constantname[ numberstring ] = constantname;
	}
    }





    
    function funBodyCodeC_optimByConstruction( typed_out_varname, typed_out_vartype, out_e, idnum2type, idnum2expr, duplicates, dupliidnum2varname, idnum2usage )
    {
        var is_out_type_simple = 'string' === typeof typed_out_vartype
        ,   ret = [ ]
	,   type2numberstring2constantname = {}
        ,   constantname2declcode = {}
	,   constantnameArr = []
        ,   error
        ;

        (idnum2usage  ||  null).hasOwnProperty.call.a;  // Cheap assert: must be a non-null object

        if (is_out_type_simple)
        {
            // Use return

            'xxx return'
        }
        else
        {
            // Do not use return
            
            var is_level_1, basictype;
            
            if (
                typeIsArraySametype( typed_out_vartype )  &&  
                    (
                        (is_level_1 = 'string' === typeof (basictype = typed_out_vartype[ 0 ]))  ||  
                            (typeIsArraySametype( typed_out_vartype[ 0 ] )  &&  'string' === typeof (basictype = typed_out_vartype[ 0 ][ 0 ]))
                    )
            )
            {
                basictype.substring.call.a;  // Must be a string

                if (ALIGNED_DATA  &&  !is_level_1)
                {
                    var outptr = '__outptr__'; // xxx check against "duplicates" varnames to prevent collision.
                    ret.unshift( basictype + '*' + outptr + ' = ' + typed_out_varname + '[0];' );
                }

                // --- (a)(b) Prepare all code lines, intermediary and output together.
                
                var idnum2codeline = {};
                
                // (a) Intermediary calculations

                for (var n = duplicates.length, i = 0; i < n; i++)
                {
                    var idnum  = duplicates[ i ]
                    ,   d_e    = idnum2expr[ idnum ]
                    ,   d_type = idnum2type[ idnum ]
                    ,   d_name = dupliidnum2varname[ idnum ]
                    ,   d_e_idnum = d_e.__exprIdnum__
                    ;
                    d_type.substring.call.a;  // Must be a simple type
                    d_e_idnum.toPrecision.call.a;  // Must be a number
                    
                    idnum2codeline[ d_e_idnum ] = d_type + ' ' + d_name + ' = ' + expcode_cast_if_needed( d_type, d_e, d_name ) + ';'
                }
                
                // (b) Return values

                for (var n = out_e.length, i = 0; i < n; i++)
                {
                    if (is_level_1)
                    {
                        var ei = out_e[ i ]
                        , ei_idnum = ei.__exprIdnum__
                        , code = typed_out_varname + '[' + i + '] = ' + expcode_cast_if_needed( basictype, out_e[ i ] ) + ';'
                        ;
                        ei_idnum.toPrecision.call.a;  // Must be a number
                        idnum2codeline[ ei_idnum ] = code;
                    }
                    else
                    {
                        for (var p = typed_out_vartype[ 0 ].length, j = 0; j < p; j++)
                        {
                            var eij = out_e[ i ][ j ]
                            
                            , assign = ALIGNED_DATA 
                                ? outptr + '[' + ( p * i + j ) + ']'
                                : typed_out_varname + '[' + i + ']' + '[' + j + ']'

                            ,  code = assign + ' = ' + expcode_cast_if_needed( basictype, eij ) + ';' 
                            ;
                            
                            if (eij  &&  eij.__isExpr__)
                            {
                                var eij_idnum = eij.__exprIdnum__;
                                eij_idnum.toPrecision.call.a;  // Must be a number
                                idnum2codeline[ eij_idnum ] = code;
                            }
                            else
                            {
                                // e.g. return value is a number constant here.
                                ret.push( code );
                            }                            
                        }
                    }
                }

                // --- Heuristic 2: order the lines to attempt to reduce register spill.

                var order = []
                ,   coded = {}

                ,   o       = get_restArrSet( idnum2expr, idnum2codeline )
                ,   restArr = o.restArr
                ,   restSet = o.restSet

                ,             o = get_idnum2needArrObj( idnum2expr, idnum2codeline )
                , idnum2needArr = o.idnum2needArr
                , idnum2needObj = o.idnum2needObj
                , idnum2useline = o.idnum2useline
                , ran
                ;
                while (ran = restArr.length)
                {
                    // Evaluate some metrics for each remaining codeline

                    var spillinfoArr = new Array( ran );
                    for (var i = 0; i < ran; i++)
                    {
                        var idnum = restArr[ i ]
                        ,      si = { idnum : idnum }

                        , needArr    = idnum2needArr[ idnum ]
                        , needArr_n  = needArr.length
                        , needObj    = idnum2needObj[ idnum ]
                        
                        , has_need_in_future = false
                        ;

                        idnum.toPrecision.call.a;  // Must be a number

                        for (var j = needArr.length; j--;)
                        {
                            var need_idnum = needArr[ j ];
                            if (need_idnum in restSet)
                            {
                                has_need_in_future = true;
                                break;
                            }
                        }
                        
                        var spillforce_past
                        ,   spillforce_future
                        ;
                        if (has_need_in_future)
                        {
                            spillforce_past = spillforce_future = +Infinity;
                        }
                        else
                        {
                            // Metric: spillforce_past := mean square
                            // over needs of:
                            //
                            // the number of codelines between now and 
                            // past creation/usage of the need.
                            
                            var sumsq = 0
                            ,   n_past_creation   = 0
                            ,   n_past_common_use = 0
                            ;
                            for (var order_n = order.length
                                 , j = order_n ; j-- ; )
                            {
                                var tmp_idnum = order[ j ];
                                tmp_idnum.toPrecision.call.a;  // Must be a number
                                
                                if (tmp_idnum in needObj)
                                {
                                    n_past_creation++;
                                    var between = order_n - j - 1;
                                    sumsq += between * between;
                                }
                                else
                                {
                                    var tmp_needObj = idnum2needObj[ tmp_idnum ];
                                    for (var k = needArr.length; k--;)
                                    {
                                        if (needArr[ k ] in tmp_needObj)
                                        {
                                            n_past_common_use++;
                                            var between = order_n - j - 1;
                                            sumsq += between * between;
                                        }
                                    }
                                }
                            }
                            
                            if (needArr.length !== n_past_creation)
                                error.bug;

                            var n_past_total = n_past_creation + n_past_common_use
                            ,   z = n_past_total  &&  (sumsq / n_past_total)
                            ;
                            spillforce_past = needArr_n  ?  -1-1/(1+z)  :  0;
                            
                            // Metric: spillforce_future := mean
                            // square over usages of: 
                            //
                            // the number of uncoded needs of the
                            // usage.

                            var sumsq   = 0
                            ,   useline   = idnum2useline[ idnum ]  ||  []
                            ,   useline_n = useline.length
                            ;
                            for (var j = useline_n; j--; )
                            {
                                var uj_idnum   = useline[ j ];
                                if (uj_idnum === out_e.__exprIdnum__)
                                    continue;
                                
                                var uj_needArr = idnum2needArr[ uj_idnum ]
                                ,   uj_n_future = 0
                                ;
                                for (var k = uj_needArr.length; k--;)
                                {
                                    var uj_nak = uj_needArr[ k ];
                                    if (uj_nak in restSet)
                                        uj_n_future++;
                                }
                                sumsq += uj_n_future * uj_n_future;
                            }

                            var z = useline_n  &&  (sumsq / useline_n);
                            spillforce_future = useline_n  ?  -1-1/(1+z)  :  0;
                        }
                        
                        spillforce_past  .toPrecision.call.a;  // Cheap assert: must be a number
                        spillforce_future.toPrecision.call.a;  // Cheap assert: must be a number
                        
                        si.spillforce_past   = spillforce_past;
                        si.spillforce_future = spillforce_future;

                        // For debugging
                        si.e = idnum2expr[ idnum ];
                        si.__code2str_cache_cfgSTAT = si.e.__code2str_cache_cfgSTAT;

                        spillinfoArr[ i ] = si;
                    }

                    // Based on the metrics, chose the next best
                    // codeline so as to prevent register spill.
                    
                    spillinfoArr.sort( spillinfoCompare );

                    var chosen       = spillinfoArr.shift()
                    ,   chosen_idnum = chosen.idnum
                    ;
                    order.push( chosen_idnum );

                    coded[ chosen_idnum ] = 1;
                    delete restSet[ chosen_idnum ];
                    
                    var removed = 0;
                    for (var i = restArr.length; i--;)
                    {
                        if (restArr[ i ] === chosen_idnum)
                        {
                            restArr.splice( i, 1 );
                            removed++;
                        }
                    }
                    if (1 !== removed)
                        error.bug;
                    
                    // Append the chosen codeline to the program.

                    ret.push( idnum2codeline[ chosen_idnum ] );

                } // end of: while (ran = restArr.length)
            }
            else
            {
                throw new Error( 'funBodyCodeC: vartype not supported yet.' );
            }
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


        function spillinfoCompare( a, b )
        {
            var sfa_p = a.spillforce_past
            ,   sfb_p = b.spillforce_past
            ,   sfa_f = a.spillforce_future
            ,   sfb_f = b.spillforce_future
            ,   error
            ;
            // Cheap asserts: they must be numbers
            sfa_p.toPrecision.call.a;
            sfb_p.toPrecision.call.a;
            sfa_f.toPrecision.call.a;
            sfb_f.toPrecision.call.a;

            var ret = /*sfa_p < sfb_p  ?  -1  :  sfa_p > sfb_p  ?  +1
                :     sfa_f < sfb_f  ?  -1  :  sfa_f > sfb_f  ?  +1
                :  */a.idnum < b.idnum  ?  -1  :  a.idnum > b.idnum  ?  +1    // Fallback order if equal match: idnum
                :  error.bug
            ;

            return ret;
        }
        
        function expcode_cast_if_needed( outtype, e, /*?string?*/outname )
        {
            var etype  = idnum2type[ e[ _EXPR_IDNUM ] ]
            ,   jscode = e[ _JS_CODE ]
            ;
            if (jscode === outname)
            {
                // e.g. intermediary value
                
                var toe = typeof e;

                if ('number' === toe)
                    return CONSTANT_VAR  ?  code_replace_numberstring_with_constant( outtype, '' + e )  :  '' + e;
                
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
			, code_replace_numberstring_with_constant : CONSTANT_VAR && function (numberstring) { return code_replace_numberstring_with_constant( outtype, numberstring ); }
                    };
                    
                    var topopt = { 
                        do_not_cache: true
                        , no_paren: true
                    };
                    
                    jscode = e.__toStr__( opt, topopt );
                }
            }

            return outtype === etype  ?  jscode  :  '(' + outtype + ')(' + jscode + ')';
        }

        function indent( s )
        {
            return '  ' + s;
        }

	function code_replace_numberstring_with_constant( outtype, numberstring )
	// Goal: share constants.
	{
	    (numberstring || null).substring.call.a;  // Must be a non-empty string

	    var numberstring2constantname = outtype in type2numberstring2constantname 
		? type2numberstring2constantname[ outtype ]
		: (type2numberstring2constantname[ outtype ] = {})
	    ;
	    
	    if (numberstring in numberstring2constantname)
		return numberstring2constantname[ numberstring ];

	    var constantname = outtype.toUpperCase() + '_' + 
		numberstring.replace( /-/g, 'm' )
		.replace( /\./g, '_' )
		.replace( /\+/g, '+' )
	    ;
	    if (constantname in constantname2declcode)
		throw new Error('bug');

	    constantname2declcode[ constantname ] = 'const ' + outtype + ' ' + constantname + ' = ' + numberstring + ';';
	    constantnameArr.push( constantname );
	    return numberstring2constantname[ numberstring ] = constantname;
	}

    }  // end of function funBodyCodeC_optimByConstruction
    
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
    
})();
