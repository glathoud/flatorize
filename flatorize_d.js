/*
  ECMAScript implementation of "flatorize": Generate fast, flat,
  factorized ** C code ** for mathematical expressions.

  Requires: ./flatorize.js and ./flatorize_type_util.js
  
  Copyright 2013, 2014 Guillaume Lathoud
  
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

(function () {

    var FTU = flatorize.type_util;

    // ---------- Public API

    flatorize.getCodeD = flatorize_getCodeD;

    // ---------- Public API implementation

    function flatorize_getCodeD( /*object*/cfg )
    // Returns an object:
    //
    // {{{
    // { code : <array of strings (code lines)>
    //   , array_name2info : <object: <key: array name string> -> <value: object information>>
    //   , helper_* : <function>  // helper methods to generate boilerplate code
    // }
    // }}}
    // 
    //
    // Two usages:  
    // 
    // (1) In one shot, if `exprgen_fun` has no dependency, or all of them have been flatorized already
    // 
    // {{{
    // var o = flatorize.getCodeD( { name: "functionname", varstr: "a:float,b:[16 int]->c:float", exprgen: exprgen_fun } );
    // }}}
    // 
    // (2) In two steps (useful if your expression has dependencies, esp. mutual dependencies):
    // 
    // {{{
    // var switcherfun = flatorize( "a:float,b:[16 int]->c:float", exprgen_fun );
    // // ...  the remaining dependencies of `exprgen_fun` can be flatorized here ...
    // 
    // // Now we have all flatorized all dependencies of `exprgen_fun`, so we can generate code
   // var o = flatorize.getCodeD( { name: "functionname", switcher: switcherfun } );
    // }}}
    {
        var topFunName = cfg.name;   // Mandatory
        (topFunName  ||  null).substring.call.a;  // Cheap assert: Must be a string

        var js_switcher = cfg.switcher  ||  flatorize( cfg.varstr, cfg.exprgen );  // Two variants
        js_switcher.call.a;  // Cheap assert: Must be a function
        
        var js_direct   = js_switcher.getDirect  ?  js_switcher.getDirect()  :  js_switcher
        ,   fixed       = FTU.create_fixed_info( js_direct )
        ;
        
        fixed.topFunName        = topFunName;

        if (fixed.single_common_array_btd)
        {
            fixed.STRUCT_NAME = array_info_struct_name( fixed );
            fixed.struct_name = fixed.STRUCT_NAME.toLowerCase();

            (fixed.STRUCT_NAME  ||  null).substring.call.a;
            (fixed.struct_name  ||  null).substring.call.a;
        }
        

        // Syntax definitions

        fixed.castwrap          = null;  // No cast needed because same type everywhere      

        fixed.assign_statement_code            = assign_statement_code;
        fixed.declaration_statement_code       = typed_variable_declaration_statement_code;
        fixed.line_comment_code                = line_comment_code;
        fixed.read_array_value_expression_code = read_array_value_expression_code;
        fixed.return_statement_code            = return_statement_code;
        fixed.write_array_value_statement_code = write_array_value_statement_code;

        fixed.indent = indent;

        var opt = {
            helper_h_name : cfg.helper_h_name  ||  null
        }
        , ret = generateCodeD( fixed, opt )
        ;
        ret.cfg = cfg;
        return ret;
    }

    // ---------- Private details ----------

    function generateCodeD( /*object*/fixed, /*?object?*/opt )
    // Returns an object:
    //
    // {{{
    // { code : <array of strings (code lines)>
    //   , array_name2info : <object: <key: array name string> -> <value: object information>>
    //   , helper_* : <function>  // helper methods to generate boilerplate code
    // }
    // }}}
    {
        (fixed.topFunName  ||  null).substring.call.a;

        var fixed2 = Object.create( fixed ) // we will augment it a little bit with derived values, e.g. with `array_name2info`

        ,   before = []
        ,   body   = []
        ,   after  = []
        ;

        if (fixed2.single_common_array_btd)
        {
            // Dealing with arrays

            var cat = fixed2.single_common_array_btd.type;

            fixed2.sca_name = FTU.get_new_varname( fixed2, 'io_array' );
            fixed2.sca_type = cat;
        }
        
        FTU.extract_array_info_and_count( fixed2 );

        var funDeclCode = funDeclCodeD( fixed2 );

        before = [ 
            funDeclCode
            , '/* code generated by flatorize_d.js */'
            , '{'
        ];
        
        body = FTU.fun_body_imperative_code( fixed2 );
        
        after = [ '}' ];
        
        var code = before.concat( body ).concat( after ).join( '\n' )

        ,   has_array = !!fixed2.single_common_array_btd

        ,   ret  = {

            name                : fixed2.topFunName
            , simple_in_vararr  : fixed2.simple_in_vararr
            , STRUCT_NAME       : fixed2.STRUCT_NAME
            , struct_name       : fixed2.struct_name
            , typed_in_var      : fixed2.typed_in_var
            , typed_out_varname : fixed2.typed_out_varname
            , typed_out_vartype : fixed2.typed_out_vartype
            
            , has_simple_output : fixed2.has_simple_output

            , code            : code

            , funDeclCode     : funDeclCode

            , has_array       : has_array

            , helper_h_dfltcode : helper_h( opt )
            , helper_d_dfltcode : helper_d( opt )

            , helper_h        : helper_h
            , helper_d        : helper_d

        }
        ;       
        if (ret.has_array)
        {
            ret.array_type      = fixed2.single_common_array_btd.type;
            ret.array_name2info = fixed2.array_name2info;
            ret.array_count     = fixed2.count;
        }
        
        return ret;

        function helper_h( /*?object?*/opt )
        {
            return helper_h_code( fixed2, opt );
        }

        function helper_d( /*?object?*/opt )
        {
            return helper_d_code( fixed2, { code : code }, opt );
        }
    }


    function funDeclCodeD( fixed )
    {
        var untyped_vararr    = fixed.untyped_vararr    
        ,   typed_in_var      = fixed.typed_in_var     
        ,   topFunName        = fixed.topFunName       
        ,   typed_out_varname = fixed.typed_out_varname
        ,   typed_out_vartype = fixed.typed_out_vartype
        ,   array_name2info   = fixed.array_name2info   
        
        ,   is_out_type_simple = 'string' === typeof typed_out_vartype
        ,   arr = [ ]
        ;
        arr.push( is_out_type_simple  ?  typed_out_vartype  :  'void' );
        arr.push( topFunName, '(' );

        var declArr = fixed.simple_in_vararr.map( decl_in_var );
        
        if (fixed.single_common_array_btd)
            declArr.push( '/*input and/or output array(s):*/ ' + decl( fixed.sca_name, fixed.sca_type + '*', /*notconst:*/true ) );
        
        arr.push( declArr.join( ', ' ) );

        arr.push( ')' );
        
        return arr.join( ' ' );

        function decl_in_var( varname )
        {
            var vartype = typed_in_var[ varname ];
            return decl( varname, vartype );
        }

        function decl( varname, vartype, /*?boolean?*/notconst )
        {
            var sArr = notconst  ?  []  :  [ 'const' ];
            if ('string' === typeof vartype)
            {
                sArr.push( vartype, varname );
            }
            else 
            {
                null.bug;
            } 
            
            return sArr.join( ' ' );
        }
    }


    
    // ---------- Syntax definitions
    
    function assign_statement_code( /*string*/name, /*string*/code )
    {
        return name + ' = ' + code + ';';
    }
    

    function typed_variable_declaration_statement_code( /*string*/name, /*string*/type )
    {
        return type === 'float'  ||  type === 'double'  ||  type === 'int'  ?  type + ' ' + name + ';'  :  null.unsupported;
    }

    function line_comment_code( s )
    {
        return '/* ' + s + ' */';
    }


    function read_array_value_expression_code( /*string*/array_name, /*integer*/ind )
    {
        (array_name  ||  null).substring.call.a;
        ind.toPrecision.call.a;

        return array_name + '[' + ind + ']';
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

    

    // ---------- Helpers to generate boilerplate code

    function helper_h_code( /*object*/fixed, /*?object?*/opt )
    {
        var lines = [ 
            line_comment_code( '--- Code generated by helper_h' + ( !opt  ?  '()'  :  '(opt: ' + JSON.stringify( opt  ||  null ) + ')' ) + ' ---' ) 
            , ''
        ]
        ,   arr   = fixed.arrayname_arr
        ,   an2i  = fixed.array_name2info
        ;
        if (arr  &&  arr.length)
        {
            var sca_name = fixed.sca_name
            ,   sca_type = fixed.sca_type
            ;
            (sca_name  ||  null).substring.call.a;
            (sca_type  ||  null).substring.call.a;
            
            
            lines.push( line_comment_code( helper_text( fixed ) ) );

            var STRUCT_NAME = fixed.STRUCT_NAME;
            lines.push.apply(
                lines
                , [
                    ''
                    , 'struct ' + STRUCT_NAME 
                    , '{' 
                    , ''
                ].concat( 
                    [ 
                        line_comment_code( 'convenience access to parts of `' + sca_name + '`: individual sizes' ) 
                    ]
                        .concat( 
                            arr.map( function ( name ) {
                                var info = an2i[ name ];
                                return [ 
                                    'const int ' + array_name_N( name ) + ';      ' + line_comment_code( info.n + '' ),
                                    'const int ' + array_name_NBYTES( name ) + '; ' + line_comment_code( info.n + '* ' + info.type + '.sizeof )' ),
                                ];
                            } ).reduce( concat_two_arrays ) )

                    // On some platform GCC requires array[] to come
                    // before the convenience pointers, otherwise a
                    // bug may lead to a decrement of array when
                    // the malloc helper function returns. I love C.
                    //
                    // Take home: struct: first array[], then ptr*
                        .concat( [
                            ''
                            , line_comment_code( 'a single chunk `' + sca_name + '` will be allocated (might help CPU caching)' )
                            , sca_type + ' ' + sca_name + '[' + fixed.count + '];'
                        ] ).concat( [
                            '',
                            line_comment_code( 'convenience access to parts of `' + sca_name + '`: individual pointers' ),
                        ] )
                        .concat( arr.map( function ( name ) {
                            
                            var info = an2i[ name ];
                            
                            return sca_type + '* ' + name + '; ' +
                                line_comment_code(
                                    ( 
                                        info.is_input  ?  'input'
                                            : info.is_output  ?  'output'
                                            : null.bug 
                                    ) + ': ' + info.type_string
                                )
                            ;
                        } ) )
                        .map( indent ) 
                )
                    .concat( [
                        ''
                        , '};'
                    ] )
            );
            

        }

        return lines.join( '\n' );
    }

    function helper_text( fixed )
    {
        return 'Helper functions to allocate/free ' + fixed.sca_name + ', and convenience array accesses';
    }
    
    function generated_text( fixed )
    {
        return 'Generated flatorized implementation';
    }
    
    function please_please( fixed )
    {
        return 'Please please call me sometime';
    }


    function helper_d_code( /*object*/fixed, /*object*/cfg, /*?object?*/opt )
    {
        var helper_h_name = (opt  &&  opt.helper_h_name)  ||  "helper_decl.d"

        ,   lines = [ 
            line_comment_code( '--- Code generated by helper_d' + ( !opt  ?  '()'  :  '(opt: ' + JSON.stringify( opt  ||  null ) + ')' ) + ' ---' ) 
            , ''
        ]
        ,   arr   = fixed.arrayname_arr
        ,   an2i  = fixed.array_name2info
        ;
        if (arr  &&  arr.length)
        {
            
            lines = lines
                .concat(
                    [
                        'import core.memory, std.stdio, core.stdc.stdlib;'
                        , 'import ' + helper_h_name.replace (/\.d$/,'') + '; ' + line_comment_code( 'customizable, or customized, through `opt.helper_h_name`' )
                        , ''
                        , ''
                        , line_comment_code( helper_text( fixed ) )
                        , ''
                    ] 
                )
                .concat( helper_init_impl( fixed, opt ) )
                .concat( [ '' ] )
                .concat( helper_done_impl( fixed, opt ) )
            ;
        }
        
        lines.push(
            '' 
            , ''
            , line_comment_code( generated_text( fixed ) )
            , ''
        );
        lines = lines.concat( cfg.code );

        return lines.join( '\n' );
    }
    

    function helper_init_decl( /*object*/fixed, /*?object?*/opt )
    {
        var sca_name = fixed.sca_name
        ,   sca_type = fixed.sca_type
        ;
        (sca_name  ||  null).substring.call.a;
        (sca_type  ||  null).substring.call.a;
        
        return fixed.STRUCT_NAME + '* ' + fixed.topFunName + '_malloc()';
    }

    function helper_init_impl( /*object*/fixed, /*?object?*/opt )
    {
        return [
            helper_init_decl( fixed, opt )
            , '{'
        ]
            .concat( helper_init_body( fixed, opt ).map( indent ) )
            .concat( [
                '}'
            ] );
    }

    function helper_init_body( /*object*/fixed, /*?object?*/opt )
    {
        var STRUCT_NAME = fixed.STRUCT_NAME
        ,   RET         = 'ret'
        ,   INIT        = 'INIT'
        ,   an2i        = fixed.array_name2info
        ,   sca_name    = fixed.sca_name
        ,   sca_type    = fixed.sca_type

        ,   arr         = fixed.arrayname_arr
        ,   has_arr     = arr  &&  arr.length > 0   

        ,   an2i        = fixed.array_name2info
        ;
        (sca_name  ||  null).substring.call.a;
        (sca_type  ||  null).substring.call.a;

        return [
        ]
            .concat( [
                ''
                , STRUCT_NAME + '* ' + RET + ' = new ' + STRUCT_NAME
                , '('
                , line_comment_code( 'Constant values: individual array sizes' )
                , arr.map( function ( name ) {
                    var info = an2i[ name ]
                    ,   n    = info.n
                    ,   type = info.type
                    ;
                    (n  ||  null).toPrecision.call.a;
                    (type  ||  null).substring.call.a;
                    return [
                        info.n + ''
                        , info.n + ' * ' + type + '.sizeof'
                    ];
                } ).reduce( concat_two_arrays ).join( ', ' )
                , ');'
                , ''
                , 'if (null == ' + RET + ')'
                , '{'
                , indent( 'stderr.writeln( "Memory allocation failed: `' + STRUCT_NAME + '`." );' )
                , indent( 'exit( 1 );' )
                , '}'
            ] )
            .concat( fixed.array_in_vararr.map( array_convenience ) )
            .concat( fixed.typed_out_varname in fixed.array_name2info  
                     ?  [ array_convenience( fixed.typed_out_varname ) ]
                     :  []
                   )
            .concat( [
                ''
                , 'return ' + RET + ';'
            ] )
        ;

        function array_convenience( /*string*/name )
        {
            var info = an2i[ name ];
            
            return RET + '.' + name + ' = cast(' + info.type + '*)(' + RET + '.' + sca_name + ') + ' + info.begin + ';'
        }
    }
    


    function helper_done_decl( /*object*/fixed, /*?object?*/opt )
    {
        var sca_name = fixed.sca_name
        ,   sca_type = fixed.sca_type
        ;
        (sca_name  ||  null).substring.call.a;
        (sca_type  ||  null).substring.call.a;

        var STRUCT_NAME = fixed.STRUCT_NAME
        ,   struct_name = fixed.struct_name
        ;

        return 'void ' + new Array( STRUCT_NAME.length-2 ).join( ' ' ) + fixed.topFunName + '_free( ' + STRUCT_NAME + '* ' + struct_name + ' )';
    }

    function helper_done_impl( /*object*/fixed, /*?object?*/opt )
    {
        var sca_name = fixed.sca_name
        ,   sca_type = fixed.sca_type
        ;
        (sca_name  ||  null).substring.call.a;
        (sca_type  ||  null).substring.call.a;
        
        var STRUCT_NAME = fixed.STRUCT_NAME
        ,   struct_name = fixed.struct_name
        ;

        return [
            helper_done_decl( fixed, opt ) + ' ' + line_comment_code( please_please( fixed ) )
            , '{'
        ]
            .concat( [
                // not needed (check in depth "new" in D -> should be garbaged, but cannot predict when) 'free( ' + struct_name + ' );'
            ].map( indent ) )
            .concat( [
                '}'
            ]);
    }



    function array_info_struct_name( fixed )
    {
        return fixed.topFunName.toUpperCase() + '_ARRAY_INFO'; 
    }


    function array_name_N( name ) { return name.toUpperCase() + '_N'; }
    function array_name_NBYTES( name ) { return name.toUpperCase() + '_NBYTES'; }

    function concat_two_arrays( a, b ) { return a.concat( b ); }

})();
