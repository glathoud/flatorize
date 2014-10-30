/*
  Tools for generating typed code, used by e.g. ./flatorize_asmjs.js
  and ./flatorize_c.js

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

    // Tools for generating typed code, used by e.g. ./flatorize_asmjs.js
    // and ./flatorize_c.js

    // ---------- Public API

    var FTU = flatorize.type_util = {
        castwrap_spare                      : castwrap_spare
        , flatten_duplicates                : flatten_duplicates
        , name_2_info_side                  : name_2_info_side
        , propagateType                     : propagateType
        , tryToGetArrayBasicTypeDescription : tryToGetArrayBasicTypeDescription
    };

    // ---------- Public API implementation 

    var _emptyObj = {};

    function castwrap_spare( /*function*/castwrap, /*string*/type, /*string*/code )
    // Call castwrap only if necessary.
    // 
    // E.g. in asm.js if we already have `code === "+a[2]"` we don't
    // need to wrap it again `+(+a[2])`.
    // 
    // E.g. in C if we already have `code === "(double)(a[2])"` we don't
    // need to wrap it again `(double)((double)(a[2]))`
    {
        var _type2rx = castwrap._type2rx  ||  (castwrap._type2rx = {});
        if (!(type in _type2rx))
        {
            var z = "#\x00#"
            
            , s  = castwrap( type, z )
            , ht = s.split( z )
            ;

            if (ht.length !== 2)
            {
                _type2rx[ type ] = null;
            }
            else
            {
                _type2rx[ type ] = new RegExp( '^' + rxesc( ht[ 0 ] ) + '[^\\)]*?' + rxesc( ht[ 1 ] ) + '$' );
            }
        }
        var rx = _type2rx[ type ];

        return rx  &&  rx.test( code )  ?  code  :  castwrap( type, code );

        function rxesc( s )
        {
            return s.replace(/\W/g,function(c){return '\\'+c;});
        }
    }

    function flatten_duplicates( duplicates, idnum2expr, array_name2info, /*function*/castwrap, /*?object?*/single_common_array )
    // ---- asm.js support for multidimensional arrays: flatten the access
    // i.e. assuming `a` is a 3x4 matrix, `a[1][2]` becomes e.g. `float64[1*3+2]`
    //
    // Example:
    // {{{
    // var o = duplicates( duplicates, idnum2expr, array_name2info, bt_type, cat_varname )
    //
    // duplicates = o.duplicates;
    // idnum2expr = o.idnum2expr;
    // }}}
    {
        if (single_common_array)
        {
            var sca_name = single_common_array.name
            ,   sca_type = single_common_array.type
            ;
        }
        
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
                    
                    var ind = (single_common_array  ?  info.begin  :  0) + m.flat_ind;
                    if (isNaN( ind )  ||  !(ind.toPrecision))
                        null.bug;
                    
                    e.length = 1;

                    var varname = single_common_array  ?  sca_name  :  name
                    ,   vartype = single_common_array  ?  sca_type  :  info.type
                    ;
                    e[ 0 ] = castwrap_spare( castwrap
                                             , vartype
                                             , varname + '[' + ind + ']' 
                                           );
                    
                    e.part = { x : varname, where : ind };
                    
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

    function name_2_info_side( /*object*/o ) 
    {
        var name = o.name
        ,   type = o.type
        ;
        (name  ||  null).substring.call.a;
        
        var array_name2info = this.array_name2info  // Mandatory
        ,   has_count       = this.count != null  &&  'number' === typeof this.count  // Optional
        
        ,  bt  = FTU.tryToGetArrayBasicTypeDescription( type )
        
        ,  bt2 = array_name2info[ name ] = Object.create( bt )
        ;
        bt2.name        = name;
        bt2.matchFun    = matchFun;

        if (has_count)
        {
            bt2.begin   = this.count;
            bt2.end     = (this.count += bt2.n);
            
            bt2.begin_bytes = bt2.begin * bt2.type_bytes;
        }
        
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

    function propagateType( /*object e.g. `js_direct`*/info )
    {
        // Input

        var typed_in_var      = info.typed_in_var
        
        ,   exprCache         = info.exprCache

        // Output

        , idnum2type = {}
        
        // Flatten the "info" object for better performance when doing
        // the recursive walk (create less objects).

        ,             out_e = info.e
        , typed_out_vartype = info.typed_out_vartype
        ;

        // Check

        if (!out_e.__isExpr__  &&  out_e instanceof Array  &&  !(typed_out_vartype instanceof Array))
            throw new Error( '(top: array case) `out_e` and `typed_out_vartype` must be consistent!' );
        
        // Recursive walk, updating `idnum2type`
        
        propagateType_impl( out_e, typed_out_vartype );

        // Done

        return idnum2type;

        // --- Details

        function propagateType_impl( out_e, typed_out_vartype )
        {
            var out_e_isExpr 
            ,   out_e_isArray
            ,   out_e_isNumber
            ;
            
            // Check
            
            (typed_out_vartype.substring  ||  typed_out_vartype.concat).call.a;   // must be a string or an array
            
            // Determine the type of `out_e`
            
            if (out_e_isExpr = out_e.__isExpr__)
            {
                var idnum = out_e.__exprIdnum__;
                idnum.toPrecision.call.a;  // Must be a number
                
                if (idnum in idnum2type)
                    return;

                idnum2type[ idnum ] = typed_out_vartype;
            }
            else if (out_e_isArray = out_e instanceof Array)
            {
                if (!(typed_out_vartype instanceof Array))
                    throw new Error( 'Inconsistency: array expression <-> non-array type. They must be consistent.' );
            }
            else if (typeof out_e === 'number')
            {
                return;
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
                    var i_out_e = out_e[ i ]
                    ,   i_toe   = typeof i_out_e
                    ;
                    if (i_toe === 'string'  ||  i_toe === 'number')
                        continue;
                    
                    var i_idnum = i_out_e.__exprIdnum__
                    ,   i_typed_out_vartype = out_e_isExpr  ?  typed_out_vartype
                        :  out_e_isArray  ?  typed_out_vartype[ i ]
                        :  null.error
                    ;

                    if (i_idnum != null  &&  i_idnum in idnum2type)
                    {
                        if (idnum2type[ i_idnum ] !== i_typed_out_vartype)
                            null.error_or_bug;

                        continue;
                    }
                    
                    propagateType_impl( i_out_e, i_typed_out_vartype );
                }
            }
        }
    }


    function tryToGetArrayBasicTypeDescription( t )
    {
        if (t instanceof Array  &&  t.sametype)
        {
            var t0 = t[ 0 ]
            ,   n  = t.length
            ;
            
            if ('string' === typeof t0)
            {
                var dim      = 1
                ,   dim_step = [ 1 ]
                ;
                // Success
                return {
                    n : n, type : t0, dim : dim, dim_n : [ n ], dim_step : dim_step, flatIndFun : flatIndFun 
                    , type_bytes : 'double' === t0  ?  8  :  'float' === t0  ||  'int' === t0  ?  4  :  null.unsupported
                }; 
            }
            
            var sub = tryToGetArrayBasicTypeDescription( t[ 0 ] );
            if (sub)
            {
                // Success

                var dim      = 1 + sub.dim
                ,   dim_step = [ sub.dim_step[ 0 ] * sub.dim_n[ 0 ] ].concat( sub.dim_step )
                ;

                return { 
                    n       : n * sub.n
                    , type  : sub.type 
                    , type_bytes : sub.type_bytes
                    , dim   : dim
                    , dim_n : [ n ].concat( sub.dim_n )
                    , dim_step   : dim_step
                    , flatIndFun : flatIndFun
                };
            }
        }
        
        // Failure
        return null;

        function flatIndFun( /*array of `dim` indices*/ind_arr )
        {
            if (ind_arr.length !== dim)
                null.wrong_dimensionality;

            var flat_ind = 0;
            for (var i = 0; i < dim; i++)
                flat_ind += ind_arr[ i ] * dim_step[ i ];
            
            return flat_ind;
        }
    }

})();
