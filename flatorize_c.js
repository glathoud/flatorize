/*
  ECMAScript implementation of "flatorize": Generate fast, flat,
  factorized ** C code ** for mathematical expressions.

  
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

    function flatorize_getCodeC(
        switcherfun_or_typedvarstr /*switcher function | comma-separated string `typedvarstr`, e.g. "a:float,b:[16 int]->c:float"*/
        , exprgen                  /*undefined         |       function (in the `typedvarstr` case) */
    )
    // Returns a C code string.
    //
    // Two usages:  
    // 
    // (1) In one shot, if `exprgen_fun` has no dependency, or all of them have been flatorized already
    // 
    // {{{
    // var c_code_str = flatorize.getCodeC( "a:float,b:[16 int]->c:float", exprgen_fun );
    // }}}
    // 
    // (2) In two steps (useful if your expression has dependencies, esp. mutual dependencies):
    // 
    // {{{
    // var switcherfun = flatorize( "a:float,b:[16 int]->c:float", exprgen_fun );
    // // ...  the remaining dependencies of `exprgen_fun` can be flatorized here ...
    // 
    // // Now we have all flatorized all dependencies of `exprgen_fun`, so we can generate code
    // var c_code_str = flatorize.getCodeC( switcherfun );
    // }}}
    {
        var js_switcher = 
            'function' === typeof switcherfun_or_typedvarstr
            ?  switcherfun_or_typedvarstr
            :  flatorize( switcherfun_or_typedvarstr, exprgen )
        
        ,   js_direct   = js_switcher.getDirect  ?  js_switcher.getDirect()  :  js_switcher

        ,  typed_in_var = js_direct.typed_in_var
        , typed_out_var = js_direct.typed_out_var
        
        ,   e           = js_direct.e
        ,   exprCache   = js_direct.exprCache
        ,   varnameset  = js_direct.varnameset
        ;

        console.log( 'xxx flatorize_c js_direct:' );
        console.dir( js_direct );

        var idnum2type  = propagateType( js_direct )        
        ;
        
        console.log( 'xxx flatorize_c idnum2type:' );
        console.dir( idnum2type );
        
        return 'xxx';
    }

    // ---------- Private details ----------

    var isExpr = flatorize.isExpr;

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
        
        // Determine the type of `out_e`

        if (out_e_isExpr)
        {
            var idnum = out_e.__exprIdnum__;
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
        
        if (out_e instanceof Array)  // Both `isExpr` and `isTop` cases
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

})();
