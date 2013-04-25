/*
  ECMAScript implementation of "flatorize": Generate fast, flat,
  factorized ** C code ** for mathematical expressions.

  Requires: ./flatorize.js
  
  Copyright 2013 Guillaume Lathoud
  
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

/*global flatorize load*/

if ('undefined' === typeof flatorize  &&  'function' === typeof load)
    load( 'flatorize.js' );  // e.g. V8

(function () {

    // ---------- Public API

    flatorize.getCodeC = flatorize_getCodeC;

    // ---------- Public API implementation

    function flatorize_getCodeC( /*object*/cfg )
    // Returns a C code string.
    //
    // Two usages:  
    // 
    // (1) In one shot, if `exprgen_fun` has no dependency, or all of them have been flatorized already
    // 
    // {{{
    // var c_code_str = flatorize.getCodeC( { name: "functionname", varstr: "a:float,b:[16 int]->c:float", exprgen: exprgen_fun } );
    // }}}
    // 
    // (2) In two steps (useful if your expression has dependencies, esp. mutual dependencies):
    // 
    // {{{
    // var switcherfun = flatorize( "a:float,b:[16 int]->c:float", exprgen_fun );
    // // ...  the remaining dependencies of `exprgen_fun` can be flatorized here ...
    // 
    // // Now we have all flatorized all dependencies of `exprgen_fun`, so we can generate code
    // var c_code_str = flatorize.getCodeC( { name: "functionname", switcher: switcherfun } );
    // }}}
    {
        var topFunName = cfg.name;   // Mandatory
        topFunName.substring.call.a;  // Cheap assert: Must be a string

        var js_switcher = cfg.switcher  ||  flatorize( cfg.varstr, cfg.exprgen );  // Two variants
        js_switcher.call.a;  // Cheap assert: Must be a function
        
        var js_direct   = js_switcher.getDirect  ?  js_switcher.getDirect()  :  js_switcher

        ,  typed_in_var = js_direct.typed_in_var
        , typed_out_var = js_direct.typed_out_var
        
        ,   e           = js_direct.e
        ,   exprCache   = js_direct.exprCache
        ,   varnameset  = js_direct.varnameset
        ;

        console.log( 'xxx flatorize_c js_direct:' );
        console.dir( js_direct );

        var idnum2type  = propagateType( js_direct );
        
        console.log( 'xxx flatorize_c idnum2type:' );
        console.dir( idnum2type );
        
        var codelines = generateCodeC( js_direct, idnum2type, topFunName );

        return codelines.join( '\n' );
    }

    // ---------- Private details ----------

    // xxx when it works, remove the unused local vars in propagateType and generateCodeC

    var isExpr = flatorize.isExpr;

    var _EXPR_IDNUM = '__exprIdnum__';
    
    function propagateType( /*object e.g. `js_direct`*/info, /*?object?*/input_idnum2type )
    {
        // Input

        var typed_in_var      = info.typed_in_var
        
        ,   exprCache         = info.exprCache
        ,   idnum2expr        = exprCache.idnum2expr
        
        ,   out_e             = info.e
        ,   typed_out_vartype = info.typed_out_vartype

        ,   out_e_isExpr  = isExpr( out_e )
        ,   out_e_isArray = out_e instanceof Array

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

    function generateCodeC( /*object*/info, /*object*/idnum2type, /*?string?*/topFunName )
    // Returns an array of strings (code lines)
    {
        // Some of the `info` fields are only required at the top
        // level (`topFunName` given, i.e. `isTop === true`).

        var typed_in_var      = info.typed_in_var
        ,   untyped_vararr   = info.untyped_vararr
        
        ,   exprCache         = info.exprCache
        ,   idnum2expr        = exprCache.idnum2expr

        ,   duplicates         = info.duplicates
        ,   dupliidnum2varname = info.dupliidnum2varname
        
        ,   out_e             = info.e
        ,   typed_out_varname = info.typed_out_varname
        ,   typed_out_vartype = info.typed_out_vartype

        ,   isTop             = !!topFunName
        
        ,   before = []
        ,   body   = []
        ,   after  = []

        ;
        
        if (isTop)
        {
            before = [ 
                funDeclCodeC( untyped_vararr, typed_in_var, topFunName, typed_out_varname, typed_out_vartype )
                , '/* code generated by flatorize_c.js */'
                , '{'
            ];
        
            body = funBodyCodeC( typed_out_varname, typed_out_vartype, out_e, idnum2type, idnum2expr, duplicates, dupliidnum2varname )

            after = [ '}' ];
        }
        else
        {
            
        }
        
        return before.concat( body ).concat( after );
    }


    function funDeclCodeC( untyped_vararr, typed_in_var, topFunName, typed_out_varname, typed_out_vartype )
    {
        var is_out_type_simple = 'string' === typeof typed_out_vartype
        ,   arr = [ ]
        ;
        arr.push( is_out_type_simple  ?  typed_out_vartype  :  'void' );
        arr.push( topFunName, '(' );

        var declArr = untyped_vararr.map( decl_in_var );
        if (!is_out_type_simple)
            declArr.push( '/*output:*/ ' + decl( typed_out_varname, typed_out_vartype, /*notconst:*/true ) );
        
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
                sArr.push( vartype, varname );
            else if (vartype instanceof Array  &&  vartype.sametype  &&  'string' === typeof vartype[ 0 ])
                sArr.push( vartype[ 0 ], '*', varname );
            else
                throw new Error( 'funDeclCodeC: vartype not supported yet.' );

            return sArr.join( ' ' );
        }
    }

    function funBodyCodeC( typed_out_varname, typed_out_vartype, out_e, idnum2type, idnum2expr, duplicates, dupliidnum2varname )
    {
        var is_out_type_simple = 'string' === typeof typed_out_vartype
        ,   ret = [ ]
        ;
        
        // Intermediary calculations

        ret.push( '/* intermediary calculations */' );

        for (var n = duplicates.length, i = 0; i < n; i++)
        {
            var idnum  = duplicates[ i ]
            ,   d_e    = idnum2expr[ idnum ]
            ,   d_type = idnum2type[ idnum ]
            ,   d_name = dupliidnum2varname[ idnum ]
            ;
            d_type.substring.call.a;  // Must be a simple type
            ret.push( d_type + ' ' + d_name + ' = ' + expcode_cast_if_needed( d_type, d_e, d_name ) + ';' );
        }
        
        // Return

        ret.push( '', '/* output */' );

        if (is_out_type_simple)
        {
            // Use return

            'xxx return'
        }
        else
        {
            // Do not use return
            
            if (typed_out_vartype instanceof Array  &&  typed_out_vartype.sametype  &&  'string' === typeof typed_out_vartype[ 0 ])
            {
                var n = typed_out_vartype.length
                , basictype = typed_out_vartype[ 0 ]
                ;
                basictype.substring.call.a;  // Must be a string
                
                for (var i = 0; i < n; i++)
                    ret.push( typed_out_varname + '[' + i + '] = ' + expcode_cast_if_needed( basictype, out_e[ i ] ) + ';' );
            }
            else
            {
                throw new Error( 'funBodyCodeC: vartype not supported yet.' );
            }
            
        }
        
        return ret.map( indent );

        function expcode_cast_if_needed( outtype, e, /*?string?*/outname )
        {
            var etype  = idnum2type[ e[ _EXPR_IDNUM ] ]
            ,   jscode = e[ _JS_CODE ]
            ;
            if (jscode === outname)
            {
                // e.g. intermediary value
                if (e.length === 1  &&  'string' === typeof e[ 0 ])
                    jscode = e[ 0 ];
                else
                    jscode = e.__toStr__(  { dupliidnum2varname: dupliidnum2varname, duplicates : duplicates }, { no_paren : true } );
            }

            return outtype === etype  ?  jscode  :  '(' + outtype + ')(' + jscode + ')';
        }

        function indent( s )
        {
            return '  ' + s;
        }
    }
    
})();
