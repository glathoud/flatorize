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

        ,   e           = js_direct.e
        ,   exprCache   = js_direct.exprCache
        ,   varnameset  = js_direct.varnameset
        ;
        
        
        return 'xxx';
    }

})();
