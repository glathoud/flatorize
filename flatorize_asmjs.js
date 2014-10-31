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

    var FTU = flatorize.type_util
    ,   INSERT_OUTPUT_EARLY = true
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
        var single_common_array_btd = checkType( typed_in_var, typed_out_vartype )

        ,   idnum2type  = FTU.propagateType( js_direct )
        
        ,    fixed = Object.create( js_direct )
        ;

        fixed.single_common_array_btd = single_common_array_btd;
        fixed.idnum2type        = idnum2type;
        fixed.castwrap          = castwrap;      
        fixed.read_array_value_expression_code = read_array_value_expression_code;
        fixed.write_array_value_statement_code = write_array_value_statement_code;

        return generateAsmjsGen( fixed, topFunName );
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


    
    function generateAsmjsGen( /*object*/fixed, /*string*/topFunName )
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

        var out_e             = fixed.e
        
        ,   isTop             = !!topFunName

        ,   fixed2 = Object.create( fixed ) // we will augment it a little bit, e.g. with `array_name2info`
        
        ,   before = []
        ,   body   = []
        ,   after  = []
        ,   wrap   = []
        ;

        if (fixed.single_common_array_btd)
        {
            var cat = fixed.single_common_array_btd.type

            ,   cat_js = cat === 'int'  ?  'Int32'
                :  cat === 'float'  ?  'Float32'
                :  cat === 'double'  ?  'Float64'
                : (null).unsupported
            
            ,   cat_bits  = /\d+$/.exec( cat_js )|0
            ,   cat_bytes = cat_bits >> 3
            ;

            fixed2.sca_name = cat_js.toLowerCase()  // xxx make sure not in duplicates, else change cat_varname's value a bit (impl: use flatorize.xxx())
            fixed2.sca_type = cat;
        }
        else
        {
            // Dealing with scalars only
        }
        

        var simple_in_vararr = fixed2.untyped_vararr.filter( function ( name ) { return 'string' === typeof this[ name ]; }, fixed2.typed_in_var )
        ,   array_in_vararr  = fixed2.untyped_vararr.filter( function ( name ) { return 'string' !== typeof this[ name ]; }, fixed2.typed_in_var )

        ,   arraynametype    = array_in_vararr.map( function ( name ) { 
            return { 
                name   : name
                , type : fixed2.typed_in_var[ name ] 
            }; 
        } )
        ;

        fixed2.bt_out = FTU.tryToGetArrayBasicTypeDescription( fixed2.typed_out_vartype );
        
        if (fixed2.bt_out)
        {
            // Difference with the C plugin: (in the array case) input
            // array and output array types must all share the same
            // basic type.
            if (cat  &&  cat !== fixed2.bt_out.type)
                throw new Error('input & output basic types must be identical (e.g. all "double").')
            
            arraynametype.push( { 
                name   : fixed2.typed_out_varname
                , type : fixed2.typed_out_vartype 
            } );
        }

        var tmp = { count : 0, array_name2info : {} };
        
        arraynametype.forEach( FTU.name_2_info_side, tmp )
        
        var count              = fixed2.count           = tmp.count
        ,   array_name2info    = fixed2.array_name2info = tmp.array_name2info
        
        ,   asmjs_buffer_bytes = Math.ceil( count * cat_bytes / (1 << 24) ) << 24
        ;
        
        if (isTop)
        {
            before = funDeclCodeAsmjs( simple_in_vararr, fixed2.typed_in_var, topFunName );
         
            body = funBodyCodeAsmjs( fixed2 );
            
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
                , fixed2.sca_name  ?  'var ' + fixed2.sca_name + ' = new stdlib.' + cat_js + 'Array( heap );'  :  '' 
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
        
        gen.count = fixed2.count;
        gen.cat_bits = cat_bits;
        gen.cat_bytes = cat_bytes;
        gen.buffer_bytes = asmjs_buffer_bytes;

        gen.array_name2info = fixed2.array_name2info;

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

    function funBodyCodeAsmjs( fixed )
    // Returns an array of codeline strings.
    {
        var is_out_type_simple = 'string' === typeof fixed.typed_out_vartype

        , duplicates              = fixed.duplicates
        , dupliidnum2varname      = fixed.dupliidnum2varname
        , idnum2expr              = fixed.exprCache.idnum2expr
        , idnum2type              = fixed.idnum2type
        , array_name2info         = fixed.array_name2info
        , single_common_array_btd = fixed.single_common_array_btd  ||  null  // optional
        
        ,   state = { 

            ret            : []
            , ret_idnumSet : {}
            , ret_idnumMax : -Infinity
            , idnum2max_in_ret_subset : {}  // cache for speedup
        }
        ;
        
        // ---- asm.js support for multidimensional arrays: flatten the access
        // i.e. assuming `a` is a 3x4 matrix, `a[1][2]` becomes e.g. `float64[1*3+2]`

        if (single_common_array_btd)
        {
            var o = FTU.flatten_duplicates( duplicates, idnum2expr, array_name2info, castwrap, fixed.sca_name, fixed.sca_type );
            
            duplicates = o.duplicates;
            idnum2expr = o.idnum2expr;
        }
        
        // ---- asm.js "type" declarations

        FTU.declare_variables( fixed, state, duplicates, idnum2expr, asmjs_typed_variable_declaration_statement_code );

        // ---- Intermediary calculations

        if (!INSERT_OUTPUT_EARLY)
            state.ret.push( '/* Intermediary calculations: implementation */' );

        for (var n = duplicates.length, i = 0; i < n; i++)
        {
            var idnum  = duplicates[ i ]
            ,   d_e    = idnum2expr[ idnum ]
            ,   d_type = idnum2type[ idnum ]
            ,   d_name = dupliidnum2varname[ idnum ]
            ;
            (d_type  ||  null).substring.call.a;  // Must be a simple type

             FTU.push_nonString
            (
                state
                , idnum
                , FTU.code_and_expr_2_object_with_dep_info( 
                    dupliidnum2varname
                    , idnum
                    , d_name + ' = ' + FTU.expcode_cast_if_needed( fixed, state, d_type, d_e, d_name ) + ';'
                    , d_e
                )
            );
        }
                
        // Return

        if (!INSERT_OUTPUT_EARLY)
            state.ret.push( '', '/* output */' );

        if (is_out_type_simple)
        {
            // Use return

            state.ret.push( 'return ' + FTU.expcode_cast_if_needed( fixed, state, fixed.typed_out_vartype, fixed.e ) + ';' );
        }
        else
        {
            // Arrays: Do not use return

            FTU.outarray_code_push_recursive( fixed, state, fixed.e, INSERT_OUTPUT_EARLY );
        }
        
        return state.ret.map( indent );

        function indent( s )
        {
            return '  ' + s;
        }

    }


    function asmjs_typed_variable_declaration_statement_code( /*string*/name, /*string*/type )
    {
        return 'var ' + name + ' = ' + (
            type === 'float'  ||  type === 'double'   ?  '0.0'
                : type === 'int'  ?  '0'
                : (null).unsupported
        ) + ';'
        ;
    }


    function read_array_value_expression_code( /*string*/array_name, /*integer*/ind )
    {
        (array_name  ||  null).substring.call.a;
        ind.toPrecision.call.a;

        return array_name + '[' + ind + ']';
    }

    function castwrap( /*string*/type, /*string*/code)
    {
        return type === 'double'  ||  type === 'float'  ?  '+(' + code + ')'
            : type === 'int'  ?  '((' + code + ')|0)'
            : null.unsupported
        ;
    }


    function write_array_value_statement_code( /*string*/array_name, /*integer*/ind, /*string*/code )
    {
        return array_name + '[' + ind + '] = ' + code + ';';
    }

})(this);
