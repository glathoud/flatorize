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

    var FTU = flatorize.type_util;

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
        ,   fixed       = FTU.create_fixed_info( js_direct )
        ;
        
        fixed.topFunName        = topFunName;

        // Syntax definitions

        fixed.castwrap          = castwrap;      

        fixed.assign_statement_code            = assign_statement_code;
        fixed.declaration_statement_code       = asmjs_typed_variable_declaration_statement_code;
        fixed.line_comment_code                = line_comment_code;
        fixed.read_array_value_expression_code = read_array_value_expression_code;
        fixed.return_statement_code            = return_statement_code;
        fixed.write_array_value_statement_code = write_array_value_statement_code;

        fixed.indent = indent;

        return generateAsmjsGen( fixed );
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

    function generateAsmjsGen( /*object*/fixed )
    // Returns a `gen` function that can be called to compile the
    // asm.js code, e.g.
    // 
    // {{{
    // var o = gen( window, {}, heap );  // compile the asm.js code
    // 
    // // Use it:
    // var result = o[ fixed.topFunName ]( some, input, parameters );
    // }}}
    //
    // `o[ fixed.topFunName ]` may also modify the heap in-place,
    // in which case you have to write inputs and read outputs
    // through the heap.
    //
    // For more examples of use see ./asmjs.html
    // 
    // glathoud@yahoo.fr
    {
        (fixed.topFunName  ||  null).substring.call.a;

        var fixed2 = Object.create( fixed ) // we will augment it a little bit with derived values, e.g. with `array_name2info`

        ,   before = []
        ,   body   = []
        ,   after  = []
        ,   wrap   = []
        ;

        if (fixed2.single_common_array_btd)
        {
            // Dealing with arrays

            var cat = fixed2.single_common_array_btd.type

            ,   cat_js = cat === 'int'  ?  'Int32'
                :  cat === 'float'  ?  'Float32'
                :  cat === 'double'  ?  'Float64'
                : (null).unsupported
            
            ,   cat_bits  = /\d+$/.exec( cat_js )|0
            ,   cat_bytes = cat_bits >> 3
            ;

            fixed2.sca_name = FTU.get_new_varname( fixed2, cat_js.toLowerCase() )
            fixed2.sca_type = cat;
        }
        else
        {
            // Dealing with scalars only
        }

        
        FTU.extract_array_info_and_count( fixed2 );

        var asmjs_buffer_bytes = Math.ceil( fixed2.count * cat_bytes / (1 << 24) ) << 24;
        
        before = funDeclCodeAsmjs( fixed2 );
        
        body = FTU.fun_body_imperative_code( fixed2 );
        
        after = [ '}' ];
        
        wrap = [ '', return_statement_code( '{ ' + fixed2.topFunName + ' : ' + fixed2.topFunName + ' }' ) ];
        
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

        gen.array_type      = cat_js  &&  cat;
        gen.array_name2info = cat_js  &&  fixed2.array_name2info;
        gen.TypedArray      = cat_js  &&  global[ cat_js + 'Array' ];  // Constructor function, e.g. Float64Array

        return gen;
    }
    

    function funDeclCodeAsmjs( fixed )
    // Returns an array of codeline strings.
    {
        return [
            'function ' + fixed.topFunName + '( ' + fixed.simple_in_vararr.join( ', ' ) + ' )'
            , '{'
        ].concat(
            fixed.simple_in_vararr.map( function (name) {

                var t = fixed.typed_in_var[ name ];

                if (t === 'float'  ||  t === 'double')
                    return name + '= +' + name + ';';

                if (t === 'int')
                    return name + '= ' + name + '|0;';

                (null).unsupported;
            })
        );
    }

    // Syntax definitions
    
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
