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
        (topFunName  ||  null).substring.call.a;  // Cheap assert: Must be a string

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
        var single_common_array_btd = FTU.check_single_common_array_type( typed_in_var, typed_out_vartype )

        ,   idnum2type  = FTU.propagateType( js_direct )
        
        ,    fixed = Object.create( js_direct )
        ;

        fixed.single_common_array_btd = single_common_array_btd;
        fixed.idnum2type        = idnum2type;

        fixed.castwrap          = castwrap;      

        fixed.assign_statement_code            = assign_statement_code;
        fixed.declaration_statement_code       = asmjs_typed_variable_declaration_statement_code;
        fixed.line_comment_code                = line_comment_code;
        fixed.read_array_value_expression_code = read_array_value_expression_code;
        fixed.return_statement_code            = return_statement_code;
        fixed.write_array_value_statement_code = write_array_value_statement_code;

        fixed.indent = indent;

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
        (topFunName  ||  null).substring.call.a;

        var out_e             = fixed.e

        ,   fixed2 = Object.create( fixed ) // we will augment it a little bit with derived values, e.g. with `array_name2info`
        
        ,   before = []
        ,   body   = []
        ,   after  = []
        ,   wrap   = []
        ;

        if (fixed.single_common_array_btd)
        {
            // Dealing with arrays

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

        
        FTU.extract_arraynametype( fixed2 );

        
        var tmp = { count : 0, array_name2info : {} };
        
        fixed2.arraynametype.forEach( FTU.name_2_info_side, tmp )
        
        fixed2.count           = tmp.count;
        fixed2.array_name2info = tmp.array_name2info;
        
        var asmjs_buffer_bytes = Math.ceil( fixed2.count * cat_bytes / (1 << 24) ) << 24;
        
        before = funDeclCodeAsmjs( fixed2.simple_in_vararr, fixed2.typed_in_var, topFunName );
        
        body = FTU.fun_body_imperative_code( fixed2 );
        
        after = [ '}' ];
        
        wrap = [ '', return_statement_code( '{ ' + topFunName + ' : ' + topFunName + ' }' ) ];
        
        // ---------- asm.js wrapper generator ----------

        var gen = new Function(
            'stdlib', 'foreign', 'heap',
            [ 
                '/* code generated by flatorize.asmjsGen.js */'
                , '"use asm";'
                , ''
                , fixed2.sca_name  
                    ?  'var ' + assign_statement_code( fixed2.sca_name, 'new stdlib.' + cat_js + 'Array( heap )' )
                    :  '' 
                , ''
            ]
                .concat( before
                         .concat( body )
                         .concat( after )
                       )
                .concat( wrap )
                .map( indent )
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

    function assign_statement_code( /*string*/name, /*string*/code )
    {
        return name + ' = ' + code + ';';
    }
    

    function asmjs_typed_variable_declaration_statement_code( /*string*/name, /*string*/type )
    {
        return 'var ' + assign_statement_code(
            name
            , type === 'float'  ||  type === 'double'   ?  '0.0'
                : type === 'int'  ?  '0'
                : (null).unsupported
        );
    }

    function line_comment_code( s )
    {
        return '// ' + s;
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

    function return_statement_code( /*string*/code )
    {
        return 'return ' + code + ';';
    }


    function write_array_value_statement_code( /*string*/array_name, /*integer*/ind, /*string*/code )
    {
        return array_name + '[' + ind + '] = ' + code + ';';
    }

    function indent( s )
    {
        return '  ' + s;
    }

})(this);
