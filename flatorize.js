/*
  ECMAScript implementation of "flatorize": Generate fast, flat,
  factorized code for mathematical expressions.

  
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

// xxx the algebraic simplification functions have grown and should
// better be placed in a separate file.

(function (global) {

    // ---------- Public API ----------

    global.flatorize = flatorize;

    flatorize.now  = flatorize_now;  // Convenience wrapper around `flatorize`.
    flatorize.expr = expr;    // To build and expression.
    flatorize.part = part;    // To extract a property of an array or object.
    
    // Extra tools, mostly used by the asm.js and C plugins 

    flatorize.isExpr = function (e) { return e  &&  e.__isExpr__; };
    
    // ---------- Public API implementation ----------

    function part( x, where )
    {
        if ('string' !== typeof x  &&  !x.__isExpr__)   // Try to solve right away
            return x[ where ];

        // Else form an expression string, and wrap it into `expr()` to
        // make it optimizeable (see `gathering` further below).
        var ps = '[' + ( 'number' === typeof where  ?  where  :  '"' + where + '"' ) + ']' 
        ,  ret = 'string' === typeof x
            ?  expr( x + ps )
            :  expr( x, ps )  // Permits finer optimization, because e.g. `a[0][2]` and `a[0][3]` share `a[0]`
        ;
        
        // Mark the expression as a "part" - not necessary for
        // JavaScript (the present file), but useful e.g. for typed
        // languages, to propagate types (e.g. ./flatorize_c.js).
        var part = ret.part = { x : x, where : where };
        if (Object.freeze)
            Object.freeze( part );

        return ret;
    }

    var exprCache, pile_exprCache;
    
    function expr()
    {
        var ret = Array.prototype.slice.call( arguments );
        ret = expr_simplify( ret );
        
        if (ret.length === 0)
            return 0;

        if (ret.length === 1)
        {
            if (ret[0].__isExpr__  ||  'number' === typeof ret[0])
                return ret[0];
        }
        

        for (var i = ret.length; i--;)
        {
            if ('number' === typeof ret[i]  &&  isNaN( ret[i] ))
                throw new Error('expr() expected a number here.');
        }
        
        // Normalize a bit the order to increase the chance to match
        // an existing expression.
        
        ret = ret instanceof Array  ?  normalize_a_bit_the_order( ret )  :  [ ret ];

        if (ret.length === 1)
        {
            if (ret[0].__isExpr__  ||  'number' === typeof ret[0])
                return ret[0];
        }
        
        ret = wrap_products( ret );

        ret = normalize_the_sum_order( ret );

        // Finally
        
        ret = expr_flatten_minus( ret );




        // Try to find an already existing expression that matches.
        var idstr2expr = exprCache.idstr2expr
        ,        idstr = getExprIdstr( ret )
        ;
        if (idstr in idstr2expr)
            return idstr2expr[ idstr ];
        
        // Not found. Try to find all or part of a negative of the expression.
        
        var neg_arr   = getNegArr( ret )
        ,   neg_idstr = neg_arr  &&  getExprIdstr( neg_arr )
        ;
        if (neg_idstr  &&  neg_idstr in idstr2expr)
        {
            ret   = [ '-', idstr2expr[ neg_idstr ] ];
            idstr = getExprIdstr( ret ); 
            
            if (idstr in idstr2expr)   // The new compound expression may already be in the cache
                return idstr2expr[ idstr ];
        }

        // Create the expression object.
        
        ret.__isExpr__ = true;  // not safe against overwrite, but faster than a function
        ret.__toStr__  = function ( /*?object?*/opt, /*?object?*/topopt ) 
        { 
            var part = this.part
            ,   isTop = opt  &&  opt.isTop
            ;
            if (part)
            {
                var   x = part.x
                , where = part.where
                ,   ret = (
                    !isTop  &&  'string' === typeof x
                        ? x // optimization for a special case    xxx safe w.r.t. opt?
                        : code2str( x, opt, topopt )  // general case
                )
                    + 
                    (
                        'number' === typeof where 
                            ? '[' + where + ']'
                            : /^[a-zA-Z_][a-zA-Z_0-9]*$/.test( where )
                            ? '.' + where
                            : '["' + part.where.replace( /"/g, '\\"' ) + '"]'
                    )
                ;
            }
            else
            {
                var n = this.length
                , ret = new Array( n )
                ;
                for (var i = 0; i < n; i++)
                {
                    var xi = this[ i ]
                    ,  one = !isTop  &&  'string' === typeof xi
                        ? xi  // optimization for a special case   xxx safe w.r.t. opt?
                        : code2str( xi, opt )  // general case
                    ;
                    ret[ i ] = -1 < one.indexOf( ' ' )  &&  one[0] !== '('  &&  one[ one.length - 1 ] !== ')'
                        ?  '(' + one + ')'  
                        :  one
                    ;
                }
                
                ret = ret.join(' ');
            }
            
            if (topopt  &&  topopt.no_paren)
                return ret;
            
            return '(' + ret + ')';
        };
        
        // Update the cache

        var idnum = ret.__exprIdnum__ = exprCache.idnum_next++;

        idstr2expr[ idstr ]  = exprCache.idnum2expr[ idnum ] = ret;
        
        return ret;  // Et voilà !
    }
    
    function flatorize_now(/*string*/varstr, /*function*/exprgen)
    // Convenience shortcut. Returns a function.
    {
        return flatorize( varstr, exprgen ).getDirect();
    }

    var creatingDirect, within;
    function flatorize(/*comma-separated string*/possibly_typed_varstr, /*function*/exprgen)
    // Returns a function.
    {
        if (within)
            throw new Error('only one flatorize at a time!');
        within = true;
        
        // `varstr`: Ignore the type declarations (meant e.g. to
        // generate C code - not interesting for JS code).
        
        var varstr = possibly_typed_varstr.split('->')[ 0 ].replace( /:[^,]*/g, '' )
        ,   vararr = varstr.split(',').map(function(s) { return s.trim(); })
        ,   direct
        ;

        // Mark the input parameters

        switcher.possibly_typed_varstr = possibly_typed_varstr;
        switcher.exprgen               = exprgen;

        switcher.untyped_varstr        = varstr;
        switcher.untyped_vararr        = [].concat( vararr );
        
        // Here for JavaScript we won't need type information, but for
        // some other language we may need it (e.g. ./flatorize_c.js).

        if (varstr !== possibly_typed_varstr)
        {
            var o = get_types_from_typed_varstr( possibly_typed_varstr );
            switcher.typed_in_var      = o.typed_in_var;
            switcher.typed_out_varname = o.typed_out_varname;
            switcher.typed_out_vartype = o.typed_out_vartype;
            switcher.has_simple_output = o.has_simple_output;
        }

        // Setup API methods

        switcher.getDirect = switcher_getDirect;
        switcher.evalnow   = switcher_evalnow;

        within = false;
        return switcher;

        function switcher()
        {
            if (creatingDirect)
            {
                var e = exprgen.apply( null, arguments );  // To be called with variable name strings

                if ('string' === typeof e)
                    e = expr(e);
                
                return e;
            }
            
            if (!direct)
                switcher_getDirect();
            
            return direct.apply( null, arguments );
        }

        function switcher_getDirect()
        {
            if (!direct)
            {
                creatingDirect = 1 + ~~creatingDirect;
                (pile_exprCache || (pile_exprCache = [])).push( exprCache );

                
                exprCache = { idstr2expr:   {}
                              , idnum2expr: {}
                              , idnum_next: 0
                              , idnum2count: null
                              , idnum2usage: null
                            };
                
                check_exprgen_if_possible( exprgen );

                var e = exprgen.apply(null,vararr);
                
                e = expr_flatten_minus( e );
                
                // Input: gather statistics: how many time is each expression used?
                //
                // Implementation note: We gather those stats now (rather than
                // at construction time `expr`) because the simplifications
                // made during construction (`expr`) can be non trivial
                // w.r.t. `idnum2count`.
                
                var tmp_idnum2count = {};
                gather_count( e, tmp_idnum2count );
                
                // Now that we know idnum2count we can simplify a little bit
                // the remaining -<expr>
                simplify_a_bit_minus_expr_using_idnum2count( exprCache.idnum2expr, tmp_idnum2count );

                // Now we can try to save a few sign inversions.
                // Should be particularly useful when generating C
                // code, to minimize the number of floating sign
                // inversion, so as to reduce the corresponding 
                // memory accesses and register spills.
                
                var tmp_idnum2count = {}
                ,   tmp_idnum2usage = {}
                ;
                gather_count( e, tmp_idnum2count, tmp_idnum2usage );

                try_to_save_a_few_sign_inversions_where_beneficial( exprCache.idnum2expr, tmp_idnum2count, tmp_idnum2usage );

                // Final usage count

                gather_count( e, exprCache.idnum2count = {}, exprCache.idnum2usage = {} );

                // To prevent name collision when creating local variable names
                var varnameset = {};
                for (var i = vararr.length; i--;)
                    varnameset[ vararr[i] ] = 1
                ;
                
                var topcfg = { isTop: true, varnameset: varnameset }
                
                ,   code   = '/* ' + (exprgen + '').replace( /\/(\*.*\*)\//g, '$1') + ' */\n' + code2str( e, topcfg )

                ,   dupliidnum2varname = topcfg.dupliidnum2varname
                ,   duplicates         = topcfg.duplicates
                ;

                direct = new Function (varstr, code);  // To be called with values
                
                // We'll give access to intermediary products, useful e.g. to
                // generate code in another language.
                direct.untyped_vararr = vararr;
                if ('typed_in_var' in switcher)
                {
                    direct.typed_in_var      = switcher.typed_in_var;
                    direct.typed_out_varname = switcher.typed_out_varname;
                    direct.typed_out_vartype = switcher.typed_out_vartype;
                    direct.has_simple_output = switcher.has_simple_output;
                }
                direct.e          = e;
                direct.exprCache  = exprCache;
                direct.varnameset = varnameset;
                direct.dupliidnum2varname = dupliidnum2varname;
                direct.duplicates         = duplicates;

                // Done
                
                creatingDirect--;
                exprCache = pile_exprCache.pop();
            }
            return direct;
        }

        function switcher_evalnow()
        {
            return this.getDirect().apply( null, arguments );
        }
    }
    
    // -------------------- Private implementation --------------------

    var EPSILON = 1e-12
    ,   EPSILON_DIGITS = Math.floor( -Math.log( EPSILON ) / Math.log( 10 ) )
    ,   _empty = {}
    ;

    function get_types_from_typed_varstr( /*string*/typed_varstr )
    // Extract type information. Not used in the JavaScript case, but
    // useful for some other languages (e.g. ./flatorize_c.js).
    //
    // Returns an object with two fields `typed_in_var` and
    // `typed_out_var`. Both have the form { <varname> : <type>, ... }
    {
        var in_out = typed_varstr.split( '->' )
        ,   inArr  = in_out[ 0 ].split( ',' )
        ,  out_nt  = in_out[ 1 ].split( ':' )
        ,  outName = out_nt[ 0 ]

        ,  outTypeString = out_nt[ 1 ]
        ,  outType = parse_type( outTypeString )
        ;
        outType.type_string = outTypeString;

        return { 
            typed_in_var        : typed_arr_2_obj(  inArr )
            , typed_out_varname : outName
            , typed_out_vartype : outType
            , has_simple_output : 'string' === typeof outType
        };

        function typed_arr_2_obj( arr )
        {
            var ret = {};
            for (var n = arr.length, i = 0; i < n; i++)
            {
                var s = arr[ i ]
                ,  nt = s.split(':')
                , name = nt[ 0 ]
                , type = nt[ 1 ]
                ;
                ret[ name ] = parse_type( type );
                ret[ name ].type_string = type;
            }
            return ret;
        }

        function parse_type( /*string*/type )
        // Parse a type definition, which can be simple type, an array
        // of types (length mandatory) or an object of types.
        // 
        // That is, `type` can be "float", "double", "int", "long",
        // "[<n> <type>]" (same type for all array elements),
        // "[<type>,<type>,...]" (different types) or
        // "{<k>:<type>,<k>:<type>,...}".
        {
            var arrtype_mo = type.match( /^\s*\[\s*(.*?)\s*\]\s*$/ )
            ,   objtype_mo = !arrtype_mo  &&  type.match( /^\s*\{\s*(.*?)\s*\}\s*$/ )
            ;
            if (arrtype_mo)
            {
                // Type: Array of known length.

                var same_mo = arrtype_mo[ 1 ].match( /^\s*(\d+)\s*(.*?)\s*$/ );
                if (same_mo)
                {
                    // Same type for all elements.
                    var   len = same_mo[ 1 ] | 0
                    , subtype = parse_type( same_mo[ 2 ] )
                    ,     ret = new Array( len )
                    ;
                    for (var i = len; i--;)
                        ret[ i ] = subtype;
                    
                    ret.sametype = true;  // <<< same type: marked here
                    
                    return ret;
                }
                else
                {
                    // Different types for the various elements.
                    return arrtype_mo[ 1 ].split( ',' ).map( parse_type );
                }
            }
            else if (objtype_mo)
            {
                // Type: Object. The various keys may have values of
                // different types.

                var kv_arr = objtype_mo[ 1 ].split( ',' )
                ,   ret    = {}
                ;
                for (var n = kv_arr.length, i = 0; i < n; i++)
                {
                    var kv_mo         = kv_arr[ i ].match( /^\s*(\S+)\s*:\s*(.*?)\s*$/ );
                    ret[ kv_mo[ 1 ] ] = parse_type( kv_mo[ 2 ] );
                }
                return ret;
            }
            else
            {
                // Type: Simple numeric value.

                var t_mo = type.match(/^\s*(float|double|int|long)\s*$/);
                return t_mo[ 1 ];
            }
        }
    }

    function expr_simplify( arr )
    {
        if (arr.length < 3)
        {
            if ('number' === typeof arr[ 1 ])
            {
                if ('+' === arr[ 0 ])
                    return arr[ 1 ];

                if ('-' === arr[ 0 ])
                    return -arr[ 1 ];
                
                throw new Error('bug and/or wrong expression');
            }
            
            return arr;
        }

        for (var i = 2; i--;)
        {
            arr = expr_simplify_multiplications( arr ); 
            if (!(arr instanceof Array  &&  1 < arr.length))  break;

            arr = expr_simplify_additions( arr ); 
            if (!(arr instanceof Array  &&  1 < arr.length))  break;

            arr = expr_simplify_substractions( arr );
            if (!(arr instanceof Array  &&  1 < arr.length))  break;

            arr = expr_simplify_double_negations( arr );
            if (!(arr instanceof Array  &&  1 < arr.length))  break;

            arr = expr_simplify_plus_minus( arr ); 
            if (!(arr instanceof Array  &&  1 < arr.length))  break;
            
            arr = expr_move_times_minus( arr );
            if (!(arr instanceof Array  &&  1 < arr.length))  break;

            arr = expr_extract_minus_expr( arr );
            if (!(arr instanceof Array  &&  1 < arr.length))  break;

            if (true)
            {
                arr = expr_flatten_minus( arr );
                if (!(arr instanceof Array  &&  1 < arr.length))  break;
            }
            else
            {
                arr = expr_normalize_all_minus( arr );
                if (!(arr instanceof Array  &&  1 < arr.length))  break;                
            }
            

            arr = expr_simplify_if_all_numbers( arr );
            if (!(arr instanceof Array  &&  1 < arr.length))  break;
        }
        
        while (true)
        {
            var newarr = expr_try_to_simplify_product_associativity( arr );
            if (!newarr)
                break;

            arr = newarr;
        }
        
        var factorized = try_to_factorize( arr );
        if (null != factorized)
            arr = factorized;
        
        return arr;
    }

    function normalize_a_bit_the_order( /*array*/arr )
    {
        arr.slice.call.a;  // must be an array

        var copied_on_write = false;        
        for (var i = arr.length - 2; i >= 0; i--)
        {
            var b = arr[ i+1 ];
            if (b === '*')
            {
                var a = arr[ i ]
                ,   c = arr[ i+2 ]

                , to_a = typeof a
                , to_c = typeof c
                
                , anum = 'number' === to_a
                , cnum = 'number' === to_c
                ;
                if (!anum  &&  cnum)
                {
                    // Swap multiplicands, number comes first
                    copied_on_write  ||  (copied_on_write = true, arr = arr.slice());  // shallow copy
                    arr[ i+2 ] = a;
                    arr[ i ]   = c;
                }
                else if (!anum  &&  !cnum  &&  a.__isExpr__  &&  b.__isExpr__  &&  a.__exprIdnum__ > b.__exprIdnum__)
                {
                    // Swap multiplicands, expression with smallest id comes first
                    copied_on_write  ||  (copied_on_write = true, arr = arr.slice());  // shallow copy
                    arr[ i+2 ] = a;
                    arr[ i ]   = c;
                }               
                else if (anum  &&  cnum)
                {
                    copied_on_write  ||  (copied_on_write = true, arr = arr.slice());  // shallow copy
                    arr.splice( i, 3, a * c );
                }               
            }
        }

        // Merge minus signs of products
        
        if (arr.length > 2)
        {
            var productArr = extract_productArr( arr );

            var piArr = productArr.map( merge_minus_signs_of_product );
            
            var newarr = [];
            for (var n = piArr.length
                 , i = 0; i < n; i++
                )
            {
                var pi = piArr[ i ];
                if (i < 1)
                {
                    if (pi.sign < 0)
                        newarr.push( '-' );
                }
                else 
                {
                    newarr.push( pi.sign < 0  ?  '-'  :  '+' );
                }
                if (pi.e[0] === '+')
                    throw new Error('merge minus signs: unexpected "+" sign.');  // not implemented or not right

                newarr.push.apply( newarr, pi.e );
            }
            
            arr = newarr[ 0 ] === '+'  ?  newarr.slice( 1 )  :  newarr;
        }
        
        return arr;
    }


    function wrap_products( arr )
    {
        if (arr.length < 4)
            return arr;
        
        var ret = null;
        for (var i = arr.length - 3; i >= 0; i--)
        {
            var arr_ip1 = arr[ i+1 ];
            if (arr_ip1 === '*')
            {
                (
                    ret  ||  (ret = arr.slice())  // shallow copy
                )
                    .splice( i, 3, expr( arr[ i ], arr_ip1, arr[ i+2 ] ) )
                ;
            }
        }
        
        return ret  ||  arr;
    }


    function normalize_the_sum_order( arr )
    {
        if (arr.length < 3)
            return arr;

        var siArr = extract_sum_info_arr( arr );
        if (siArr == null)
            return arr;  // Not a pure sum
        
        siArr.sort( compare_sum_info );

        return merge_sum_info_arr( siArr );

        function compare_sum_info( a, b )
        {
            if (b.toe === 'number'  &&  a.toe !== 'number')
                return +1;
            
            if (a.toe === 'number'  &&  b.toe !== 'number')
                return -1;
            
            if (a.e.__isExpr__  &&  b.e.__isExpr__)
                return a.e.__exprIdnum__ < b.e.__exprIdnum__  ?  -1  :  +1;

            return 0;
        }
    }

    function extract_sum_info_arr( arr )
    {
        var ret = [];
        for (var i = arr.length; i--;)
        {
            var  e = arr[ i ]
            ,  toe = typeof e
            , sign = +1
            ;
            if (i > 0)
            {
                var prev = arr[ --i ];
                if (prev === '+')
                    sign = +1;
                else if (prev === '-')
                    sign = -1;
                else
                    return null;  // Not a pure sum
            }
            
            var si = {
                sign  : sign
                , e   : e
                , toe : toe
                , arr : e instanceof Array  ?  e  :  [ e ]  // For convenience, used e.g. by `hard_sum_factorized`
            };

            ret.unshift( si );
        }
        return ret;
    }

    
    function merge_sum_info_arr( siArr )
    {
        var ret = [];
        for (var n = siArr.length
             , i = 0; i < n; i++)
        {
            var si = siArr[ i ];
            if (!(i === 0  &&  si.sign > 0))
                ret.push( si.sign > 0  ?  '+'  :  '-' );
            
            ret.push( si.e );
        }
        return ret;
    }
    

    function getExprIdstr( x )
    {
        if (x instanceof Array)
        {
            var n = x.length
            , tmp = new Array(n)
            ;
            for (var i = n; i--;)
            {
                var x_i = x[ i ];
                if (x_i.__isExpr__)
                {
                    tmp[ i ] = '#' + x_i.__exprIdnum__;
                }
                else 
                {
                    var tox_i = typeof x_i;
                    if (tox_i === 'string')
                        tmp[ i ] = x_i;
                    else if (tox_i === 'boolean')
                        tmp[ i ] = '' + x_i;
                    else if (tox_i === 'number')
                        tmp[ i ] = x_i.toPrecision( EPSILON_DIGITS ).replace( /0+$/, '' );
                    else
                        throw new Error('getExprIdstr: probably a bug !');
                }
            }
            return tmp.join(' ');
        }
        
        return 'number' === typeof x  
            ?  x.toPrecision( EPSILON_DIGITS ).replace( /0+$/, '' )  
            :  '' + x
        ;
    }

    function getNegArr( arr )
    {
        // Specific case:  a*b

        if (arr.length === 3  &&  arr[1] === '*'  &&  'number' === typeof arr[0])
            return [ -arr[0] ].concat( arr.slice( 1 ) );

        // A bit more general case: toggle +/- signs

        arr = [].concat( arr );  // copy
        
        if (arr[0] === '-')      
            arr.shift();

        else if (arr[0] === '+') 
            arr[0] = '-';
        
        else if ('number' === typeof arr[0]) 
            arr[0] = -arr[0];

        else
            arr.unshift( '-' );

        for (var i = 1; i < arr.length; i++)
        {
            var x = arr[ i ];
            arr[ i ] = x === '+' ? '-'
                : x === '-'      ? '+'
                : x
            ;
        }
        return arr;
    }

    function check_exprgen_if_possible( exprgen )
    // Try to ensure that `exprgen` is a pure expression
    // (provided that function decompilation works)
    {
        var probably_decompiled = '' + exprgen
        ,   mo = probably_decompiled.match( /^\s*function\s+(\w+)?\s*\([^\)]*\)\s*\{\s*([^\s;\[]+)/ )
        ;
        if (mo)
        {
            if (mo[2] !== 'return')
                throw new Error('`exprgen` must implement a pure expression, that is only one `return` statement (necessary condition).');
        }
    }

    function code2str( code, /*?object?*/opt, /*?object?*/topopt )
    // Returns a string (JavaScript code), after two depth-first walks:
    // one walk to gather stats (how often is used a given expression),
    // one walk to generate the code including temporary variable names.
    {
        var   isTop = opt  &&  opt.isTop
        ,       cfg = isTop  ?  code2stat( code, opt )  :  opt   //  `cfg` can be nulley
        , typeof_code = typeof code
        , is_string
        , is_number
        , is_expr
        , is_array
        , is_object = ('object' === typeof code)
        , topopt_do_not_cache = topopt  &&  topopt.do_not_cache
        , topopt_no_paren     = topopt  &&  topopt.no_paren
	, code_replace_numberstring_with_constant = opt  &&  opt.code_replace_numberstring_with_constant  // Useful e.g. when generating C code, see ./flatorize_c.js
        , ret 
        ;

        // Faster code string generation through caching.
        // Useful for deeply recursive cases like DFT128.

        if (is_object  &&  !topopt_do_not_cache)
        {
            var CODE2STR_CFG_ID = code2str._CFG_ID  ||  (code2str._CFG_ID = '__code2str_cfg_id')
            ,   CODE2STR_CACHE  = '__code2str_cache' + (
                !cfg  
                    ? '_RAW'
                    : '_cfg' + (CODE2STR_CFG_ID in cfg  // an integer id of the `cfg` object
                                ?  cfg[ CODE2STR_CFG_ID ]
                                :  (cfg[ CODE2STR_CFG_ID ] = (code2str[ CODE2STR_CFG_ID ] = 1 + ~~code2str[ CODE2STR_CFG_ID ]))))
            ;
        }

        if (CODE2STR_CACHE  &&  (CODE2STR_CACHE in code))
            return code[ CODE2STR_CACHE ];
        
        if (is_string = (typeof_code === 'string'))
        {
            ret = code;
        }
        else if (is_number = (typeof_code === 'number'))
        {
            ret = '' + code;
	    if (code_replace_numberstring_with_constant)
		ret = code_replace_numberstring_with_constant( ret );
        }
        else if (is_expr = code.__isExpr__)
        {
            ret = expr2str( code, cfg, topopt );
        }
        else if (is_array = code instanceof Array)
        {
            // ret = '[ ' + code.map( function (x) { return code2str( x, cfg ); } ).join(', ') + ' ]';
            // for performance reasons, implemented using a for loop
            var n = code.length
            , tmp = new Array( n )
            ;
            for (var i = 0; i < n; i++)
                tmp[ i ] = code2str( code[ i ], cfg, /*topopt:*/{ no_paren: true } );
            
            ret = '[ ' + tmp.join(', ') + ' ]';
        }
        else if (is_object)
        {
            var retArr = [];
            for (var k in code) if (code.hasOwnProperty(k))
                retArr.push( k + ': ' + code2str( code[k], cfg, /*topopt:*/{ no_paren: true } ) )
            ret = '{ ' + retArr.join(', ') + ' }';
        }
        else
        {
            throw new Error('code2str detected a bug');
        }

        var shorthandvarname;
        if (isTop)
        {
            var varInitArr = cfg.varInitArr;
            
            ret = (varInitArr.length  ?  'var\n  ' + varInitArr.join('\n, ') + '\n;'  :  '')
                + '\nreturn ' + ret + ';\n'
            ;

            opt.dupliidnum2varname = cfg.dupliidnum2varname;
            opt.duplicates         = cfg.duplicates;
        }
        else if (shorthandvarname = cfg  &&  'object' === typeof code  &&  ('__exprIdnum__' in code)  &&  cfg.dupliidnum2varname[ code.__exprIdnum__ ])
            ret = shorthandvarname;
        
        if (CODE2STR_CACHE)
            code[ CODE2STR_CACHE ] = ret;
        
        return ret;
    }
    function expr2str( expr, opt, topopt )
    {
        return expr.__toStr__( opt, topopt );
    }

    function code2stat( code, /*object*/cfg )
    {
        if (cfg.isTop)
        {
            
            return code2stat( code, cfg = { 
                duplicates : cfg.duplicates  ||  []
                , dupliidnum2varname: {}
                , varnameset: Object.create( cfg.varnameset )
            } );
        }
        
        
        var idnum2count = exprCache.idnum2count
        ,   idnum2expr  = exprCache.idnum2expr
        
        // Output: find and setup temporary variable names
        // for duplicates = expressions used more than one time.
        
        ,   duplicates = []          // list of `idnum` (integers)
        ,   dupliidnum2varname = cfg.dupliidnum2varname  // mapping (mapping idnum   -> varname)
        ,   varnameset         = cfg.varnameset          // set     (mapping varname -> 1)
        ;
        
        // List the duplicates in their depth-first order of first use.
        
        for (var n = exprCache.idnum_next, i = 0; i < n; i++)
            if (idnum2count[ i ] > 1)
                duplicates.push( i );
        
        cfg.duplicates.unshift.apply( cfg.duplicates, duplicates );

        for (var shift = 0, n = duplicates.length, 
             i = 0; i < n; i++)
        {
            var idnum = duplicates[ i ]
            ,   varname
            ;
            
            // Prevent collision between/among local varnames and function varnames
            
            while ((varname = '_' + (i + shift).toString(36))  in  varnameset)
                shift++;

            varnameset[ varname ]  = 1;
            dupliidnum2varname[ idnum ] = varname;
        }

        var CODE2STR_CFG_ID = code2str._CFG_ID
        ,   cfgid = cfg[ CODE2STR_CFG_ID ]  ||  (cfg[ CODE2STR_CFG_ID ] = 'STAT')  // see caching above (for faster code string generation)
        ;
        
        cfg.varInitArr = duplicates.map( function (idnum) { 
            
            var tmp = Object.create( dupliidnum2varname );
            tmp[ idnum ] = null;
            
            var tmpcfg = { dupliidnum2varname: tmp, duplicates : cfg.duplicates };
            tmpcfg[ CODE2STR_CFG_ID ] = cfgid;
            
            var initcode = code2str( idnum2expr[ idnum ], tmpcfg, /*topopt:*/ { do_not_cache: true, no_paren: true } );

            // Remove superfluous top-level spaces parentheses from the
            // initialization code.
            initcode = initcode;

            return cfg.dupliidnum2varname[ idnum ] + ' = ' + initcode;
        } );
        
        return cfg;
    }

    // ---------- expression simplification details ----------

    function close_to( a, b )
    {
        return 'number' === typeof a  &&  'number' === typeof b  &&  b
            ?  Math.abs( (a-b)/b ) < EPSILON  
            :  a === b
        ;
    }

    function expr_simplify_multiplications( arr )
    {
        if (arr.length < 3  ||  0 > arr.indexOf( '*' ))
            return arr;

        arr = arr.slice(); // copy

        // 1*   and  *1

        for (var i = arr.length; i--;)
        {
            var arr_i = arr[ i ];
            if ('number' === typeof arr_i  &&
                arr[ i+1 ] === '*'  &&
                EPSILON > Math.abs( arr_i - 1 )
               )
                arr.splice( i, 2 );
        }

        for (var i = arr.length; i--;)
        {
            var arr_ip1 = arr[ i + 1 ];
            if ('number' === typeof arr_ip1  &&  arr[ i ] === '*'  &&  EPSILON > Math.abs( arr_ip1 - 1 ))
                arr.splice( i, 2 );            
        }
        
        // 0*   and  *0

        for (var i = 0; i < arr.length - 2; i++)
        {
            while (arr[ i ] === 0  &&  arr[ i+1 ] === '*')
                arr.splice( i, 3, 0 );
        }
        for (var i = arr.length; i > 1; i--)
        {
            if (arr[ i-1 ] === 0  &&  arr[ i - 2 ] === '*')
                arr.splice( i-3, i, 0 );
        }

        // -1*   and  *-1

        var arr0;
        if (arr[ 1 ] === '*'  &&  ((arr0 = arr[ 0 ]), ('number' === typeof arr0  &&  EPSILON > Math.abs( arr0 + 1 ))))
            arr.splice( 0, 2, '-' );

        var n, arr_nm1;
        while (n = arr.length , (arr[ n - 2 ] === '*'  &&  
               ((arr_nm1 = arr[ n - 1 ]), 'number' === typeof arr_nm1  &&  EPSILON > Math.abs( arr_nm1 + 1)))
              )
        {
            var arr_nm3 = arr[ n - 3 ]
            ,   arr_nm4 = arr[ n - 4 ]
            ,         p = arr_nm4 === '+'
            ,         m = arr_nm4 === '-'
            ;
            if (p  ||  m)
                arr.splice( n-4, 3, p ? '-' : '+', arr_nm3 );
            
            else
                arr.splice( n-2, 2, 'number' === typeof arr_nm3  ?  -arr_nm3  :  expr( '-', arr_nm3 ) );
        }
        
        return arr;
    }

    function expr_simplify_additions( arr ) 
    {
        var ret = null;

        // ... + 0  =>  ...

        for (var i = arr.length; 
             i--  &&  arr[ i-- ] === 0  &&  arr[ i ] === '+';)
        {
            ret  ||  (ret = arr.slice());  // shallow copy
            ret.pop();
            ret.pop();
        }
        
        // 0 + ... => ...

        if (arr[ 0 ] === 0  &&  arr[ 1 ] === '+')
            return (ret  ||  arr).slice( 2 );

        return ret  ||  arr;

    }
    
    function expr_simplify_substractions( arr )
    {
        var ret = null;

        // ... - 0  =>  ...

        for (var i = arr.length; 
             i--  &&  arr[ i-- ] === 0  &&  arr[ i ] === '-';)
        {
            ret  ||  (ret = arr.slice());  // shallow copy
            ret.pop();
            ret.pop();
        }
        
        // 0 - ... => - ...

        if (arr[ 0 ] === 0  &&  arr[ 1 ] === '-')
            return (ret  ||  arr).slice( 1 );

        
        return ret  ||  arr;
    }

    function expr_simplify_double_negations( arr )
    {
        var arr1;
        if (2 === arr.length  &&  arr[0] === '-'  &&  
            (arr1 = arr[1]) instanceof Array  &&  arr1.length === 2  &&  arr1[0] === '-'
           )
            return arr1[1];       

        arr = arr.slice();  // shallow copy
        for (var n_1 = arr.length - 1
             , i = 0; i < n_1; i++)
        {
            if (arr[i] === '-')
            {
                var next = arr[ i+1 ]
                ,   next0
                ;
                if ('number' === typeof next  &&  next < 0)
                {
                    arr[i]   = '+';
                    arr[i+1] = -next;
                }
                else if (next instanceof Array  &&  next.length === 2  &&  
                         'number' === typeof (next0 = next[0])  &&  next0 < 0)
                {
                    arr[i]   = '+';
                    arr[i+1] = expr( -next0, next[1] );
                }
                i++;
            }
        }        

        return arr;
    }

    function expr_simplify_plus_minus( arr )
    {
        arr = arr.slice();  // shallow copy

        var arr0 = arr[ 0 ], arr1;
        if (arr0  instanceof Array  &&  arr0.length === 2  &&   arr0[0] === '-'  &&  
            ((arr1 = arr[1]) === '+'  ||  arr1 === '-')
           )
            arr = arr0.concat( arr.slice( 1 ) );

        for (var n_1 = arr.length - 1
             , i = 0; i < n_1; i++)
        {
            var arr_i = arr[ i ]
            ,       p = arr_i === '+'
            ,       m = arr_i === '-'
            ;
            if (p || m)
            { 
                var xp1 = arr[i+1];

                if ('number' === typeof xp1  &&  xp1 < 0)
                {
                    arr[i]   = p  ?  '-'  :  '+';
                    arr[i+1] = -xp1;
                }
                else if (xp1.__isExpr__  &&  xp1.length === 2  &&  xp1[ 0 ] === '-')
                {
                    arr[i]   = p  ?  '-'  :  '+';
                    arr[i+1] = xp1[ 1 ];
                }
            }
        }
        return arr;
    }

    function expr_move_times_minus( arr )
    {
        var copied_on_write = false;
        for (var i = arr.length; i--;)
        {
            var arr_im1, arr_i;
            if (i > 1  &&  (arr_im1 = arr[i-1]) === '*'  &&  
                (arr_i = arr[i]) instanceof Array  &&  2 === arr_i.length  &&  arr_i[0] === '-'
               )
            {
                if (!copied_on_write)
                {
                    arr = arr.slice();  // shallow copy
                    copied_on_write = true;
                }
                arr[i-2] = expr( '-', arr[i-2] );
                arr[i]   = arr_i[1];
            }
        }
        return arr;
    }

    function expr_extract_minus_expr( arr )
    {
        for (var n_1 = arr.length - 1
             , i = 0; i < n_1; i++)
        {
            var p = arr[ i ] === '+'
            ,   m = arr[ i ] === '-'
            ;
            if ((p  ||  m)  &&  arr[ i+1 ] instanceof Array  &&  arr[ i+1 ].length === 2  &&  arr[ i+1 ][ 0 ] === '-')
                arr.splice( i, 2, p ? '-' : '+', arr[ i+1 ][ 1 ] );
        }

        return arr;
    }

    function expr_flatten_minus( arr )
    // -(a+b-c) ==> -a-b+c
    {
        if (!(arr instanceof Array))
            return arr;
        
        var arr0, arr1;
        if (!(arr.length === 2  &&  (arr0 = arr[ 0 ]) === '-'  && (arr1 = arr[ 1 ]) instanceof Array  &&  arr1.length > 1))
            return arr;
        
        // Invert each sign within `arr1` assuming one sign every two items.

        var ret = null;
        for (var last, i = last = arr1.length; i--;)
        {
            var ri = arr1[ i ]
            ,   p  = '+' === ri
            ,   m  = '-' === ri
            ,   pm = p  ||  m
            ,  two = last - i === 2
            ,   ok = pm ^ !two
            ;
            if (!ok)
                return arr; // The assumption was wrong
            
            if (pm)
            {
                (
                    ret  ||  (ret = arr1.slice())  // shallow copy
                )[ i ] = p  ?  '-'  :  '+';
            }
        }

        ret  ||  (ret = arr1.slice());  // shallow copy

        var r0 = ret[ 0 ];
        
        if (r0 === '+')
            ret.splice( 0, 1 );
        
        if (r0 !== '-') 
            ret.splice( 0, 0, '-' );
        
        return ret;
    }

    function expr_normalize_all_minus( arr )
    // -a-b-c  ==>  -(a+b+c)   because a+b+c may have been computed somewhere else
    {
        if (arr.length > 2   &&  !(arr.length % 2))  // if length is an odd number >= 3
        {
            var all_minus = true;
            for (var i = 0, n = arr.length; i < n; i += 2)
            {
                if (arr[i] !== '-')
                {
                    all_minus = false;
                    break;
                }
            }
            
            if (all_minus)
            {
                var new_subarr = arr.slice( 1 );
                for (var n = new_subarr.length
                     , i = 1; i < n; i += 2
                    )
                    new_subarr[ i ] = '+';
                
                return [ '-', expr.apply( null, new_subarr ) ];
            }
        }
        return arr;
    }


    function expr_simplify_if_all_numbers( arr )
    {
        for (var i = arr.length; i--;)
        {
            var x = arr[ i ]
            , tox = typeof x
            ;
            if (!('number' === tox  ||  ('string' === tox  &&  /^[\+\-\*\/]$/.test( x ))))
                return arr;
        }
        return new Function ('return ' + arr.join(' '))();
    }
    
    function expr_try_to_simplify_product_associativity( arr )
    // "Try": may return nulley if no modification found, else a new
    // array.
    {
        var  epsilon = 1e-14
        , arr_length = arr.length
        , arr0, arr1, arr2, arr3, arr4, arr5, arr6, arr7
        ;

        if ((arr_length === 7  ||  arr_length > 7  &&  ((arr7 = arr[7]) === '+'  ||  arr7 === '-'))  &&
            (arr1 = arr[1]) === '*'  &&  
            ((arr3 = arr[3]) === '+'  ||  arr3 === '-')  &&  
            (arr5 = arr[5]) === '*'
           )
        {
            // At this point `arr1`, `arr3` and `arr5` are guaranteed to have been set.

            arr0 = arr[ 0 ];
            arr2 = arr[ 2 ];
            arr4 = arr[ 4 ];
            arr6 = arr[ 6 ];

            var additive_rest = arr.slice( 7 )
            ,   middle
            ;
            if (null != (middle = middle_if_almost_equal(arr0, arr4)))
                return [ middle, '*', expr( arr2, arr3, arr6 ) ].concat( additive_rest );

            if (null != (middle = middle_if_almost_equal(arr2, arr4)))
                return [ middle, '*', expr( arr0, arr3, arr6 ) ].concat( additive_rest );

            if (null != (middle = middle_if_almost_equal(arr0, arr6)))
                return [ middle, '*', expr( arr2, arr3, arr4 ) ].concat( additive_rest );

            if (null != (middle = middle_if_almost_equal(arr2, arr6)))
                return [ middle, '*', expr( arr0, arr3, arr4 ) ].concat( additive_rest );


            if (null != (middle = middle_if_almost_opposite(arr0, arr4)))
                return [ middle, '*', expr( arr2, arr3 === '+'  ?  '-'  :  '+', arr6 ) ].concat( additive_rest );

            if (null != (middle = middle_if_almost_opposite(arr2, arr4)))
                return [ middle, '*', expr( arr0, arr3 === '+'  ?  '-'  :  '+', arr6 ) ].concat( additive_rest );

            if (null != (middle = middle_if_almost_opposite(arr0, arr6)))
                return [ middle, '*', expr( arr2, arr3 === '+'  ?  '-'  :  '+', arr4 ) ].concat( additive_rest );

            if (null != (middle = middle_if_almost_opposite(arr2, arr6)))
                return [ middle, '*', expr( arr0, arr3 === '+'  ?  '-'  :  '+', arr4 ) ].concat( additive_rest );

            if (additive_rest.length)
            {
                var rest_simpl = expr_try_to_simplify_product_associativity( arr.slice( 4 ));
                if (null != rest_simpl)
                    return [ arr0, arr1, arr2, arr3 ].concat( expr.apply( null, rest_simpl ) );
            }
            
            
        }

        if ((arr0 = arr[0]) instanceof Array  &&  ((arr1 = arr[1]) === '+'  ||  arr1 === '-'))
        {
            return expr_try_to_simplify_product_associativity( arr0.concat( 
                (arr2 = arr[2]) instanceof Array  ?  arr2.concat( arr.slice( 3 ))  :  arr.slice(1)
            ));
        }
        

        function middle_if_almost_equal( a, b )
        {
            if ('number' === typeof a  &&  'number' === typeof b)
            {
                if (a === 0  &&   b === 0)
                    return 0;

                if (Math.abs((a-b)/(Math.abs(a||b))) < epsilon)
                    return (a+b)/2;
            }
            
            else if (a.__isExpr__  &&  b.__isExpr__  &&  a.__exprIdnum__ === b.__exprIdnum__)
            {            
                return a;
            }
        }


        function middle_if_almost_opposite( a, b )
        {
            if ('number' === typeof a  &&  'number' === typeof b)
            {
                if (a === 0  &&   b === 0)
                    return 0;

                if (Math.abs((a+b)/(Math.abs(a||b))) < epsilon)
                    return (a-b)/2;
            }
            
            else if (a.__isExpr__  &&  b.__isExpr__  &&  b.length === 2  &&  b[0] === '-'  &&  a.__exprIdnum__ === b[1].__exprIdnum__)
            {
                return a;
            }

            else if (a.__isExpr__  &&  b.__isExpr__  &&  a.length === 2  &&  a[0] === '-'  &&  b.__exprIdnum__ === a[1].__exprIdnum__)
            {
                return a;
            }
        }
    }




    function is_pure_product( arr )
    {
        for (var i = arr.length; --i;)
        {
            var x = arr[i];
            if (!x  ||  !('number' === typeof arr[i]  ||  x.__isExpr__  ||  x === '*'))
                return false;
        }
        return true;
    }

    function try_to_factorize( arr )
    {
        var commfact = try_to_get_common_factors_of_a_pure_sum_of_pure_products( arr );
        if (!commfact)
            return;
        
        // We found common factors, let us remove them from each term of the pure sum
        var thinsum = remove_common_factors( arr, commfact );

        // Build and return the factorized expression
        var ret = [];
        for (var n = commfact.length, i = 0; i < n; i++)
            ret.push( commfact[ i ], '*' );
        
        ret.push( expr.apply( null, thinsum ) );
        
        return ret;
    }
    
    function try_to_get_common_factors_of_a_pure_sum_of_pure_products( arr )
    {
        if (arr.length < 2)
            return;
        
        var commfact = null;
        for (var i = arr.length; i--;)
        {
            var x = arr[i];
            if (x === '+'  ||  x === '-')
                continue;

            var arr2 = x.__isExpr__  ?  x.slice()  // copy
                : 'number' === typeof x  ?  [ x ]
                : null
            ;
            
            if (!(arr2  &&  is_pure_product( arr2 )))
                return;  // Not a pure sum of pure products
            
            if (!commfact)
            {
                commfact = arr2.filter( function (z) { return z.__isExpr__  ||  'number' === typeof z; } );
            }
            else
            {
                var newcommfact = [];
                for (var j = arr2.length; j--;)
                {
                    for (var k = commfact.length; k--;)
                    {
                        if (close_to( arr2[j], commfact[k]))
                        {
                            newcommfact.push( commfact[k] );
                            commfact.splice( k, 1 );
                            break;
                        }
                    }
                    
                }
                commfact = newcommfact;
            }

            if (!(commfact  &&  commfact.length))
                return;  // We did not find any common factor
        }
        return commfact;
    }

    function remove_common_factors( arr, commfact )
    {
        var n = arr.length
        , ret = new Array(n)
        ;
        for (var i = n; i--;)
        {
            var x = arr[ i ];
            if ('+' === x  ||  '-' === x)
            {
                ret[ i ] = x;
            }
            else if (x.__isExpr__)
            {
                var x2 = [].concat( x )         // copy
                ,  cf2 = [].concat( commfact )  // copy
                ;
                for (var j = x2.length; j--;)
                {
                    var x2j = x2[ j ];
                    
                    for (var k = cf2.length; k--;)
                    {
                        if (close_to( x2j, cf2[ k ]))
                        {
                            cf2.splice( k, 1 );
                            var removed = j > 0  ?  x2.splice( j-1, 2 )  :  x2.splice( j, 2 );  // Also remove the '*' sign
                            
                            if (1 < removed.length  &&  !(removed[0] === '*'  ||  removed[1] === '*'))
                                throw new Error('remove_common_factors: insanity detected!');

                            break;
                        }
                    }

                    if (!x2.length)
                    {
                        // Special case: the product contained only the common factors
                        x2 = [ 1 ];
                        break;
                    }
                }
                if (0 !== cf2.length)
                    throw new Error('remove_common_factors: could not remove all factors!');

                ret[ i ] = expr.apply( null, x2 );
            }
            else
            {
                throw new Error('not a pure sum')
            }
        }
        return ret;
    }
    
    function extract_productArr( arr )
    {
        var productArr = [];
        
        for (var current_product = [], n = arr.length
             , i = 0; i < n; i++)
        {
            var x = arr[ i ];
            if (i < n-1)
            {
                var isExpr = x.__isExpr__
                ,   isNum  = 'number' === typeof x
                ;
                if (!current_product.length  
                    ?  x === '+'  ||  x === '-'  ||  isNum  ||  isExpr   // The first item may be a sign
                    :  x === '*'  ||  isNum  ||  isExpr // in the future we may support '/' as well here, but first think about consequences elsewhere.
                   )
                {
                    current_product.push( x );
                }
                else
                {
                    if (current_product.length)
                        productArr.push( current_product );
                    
                    current_product = [ x ];
                }
            }
            else
            {
                current_product.push( x );
                productArr.push( current_product );
                // End of loop
            }
        }
        
        return productArr;
    }

    function merge_minus_signs_of_product( product, opt )
    {
        var arr  = []
        ,   sign = +1
        ;
        for (var i = product.length; i--;)
        {
            var x = product[ i ];
            if (x.__isExpr__  &&  x.length === 2  &&  (x[0] === '+'  ||  x[0] === '-'))
            {
                arr.unshift( x[ 1 ] );
                if (x[0] === '-')
                    sign = -sign;
            }
            else if ('number' === typeof x  &&  x < 0)
            {
                arr.unshift( -x );
                sign = -sign;
            } 
            else if (i === 0  &&  x === '-')
            {
                sign = -sign;
            }
            else if (!(i === 0  &&  x === '+'))
            {
                arr.unshift( x );
            }
        }
        
        var same = sign > 0  &&  (arr.length === product.length);
        if (same)
        {
            for (var i = arr.length; i--;)
            {
                if (arr[ i ] !== product[ i ])
                {
                    same = false;
                    break;
                }
            }
            if (same)
                return { sign: +1, e : product };
        }
        
        return { sign : sign, e : arr };
    }

    function gather_count( code, /*object*/idnum2count, /*?object?*/idnum2usage )
    {
        if (!(code instanceof Array))
            return;

        var rest = [ { usage : null, x : code } ];
        while (rest.length)
        {
            var   o = rest.pop()
            , usage = o.usage
            ,     x = o.x
            ;
            
            if (x.__isExpr__)
            {
                var idnum = x.__exprIdnum__
                ,   count = idnum2count[ idnum ] = 1 + (idnum in idnum2count  ?  idnum2count[ idnum ]  :  0)
                ;
                if (usage != null  &&  idnum2usage)
                    (idnum2usage[ idnum ]  ||  (idnum2usage[ idnum ] = [])).push( usage );
                
                if (count > 1)
                    continue;  // Already recursed through this expression.
            }

            if (x instanceof Array)
            {
                // Have not recursed yet, do it now.
                for (var n = x.length, i = n; i--; )
                {
                    rest.push( { 
                        usage : x
                        , x   : x[ i ] 
                    } );
                }
            }
        }
    }

    

    function merge_piArr( piArr )
    {
        var ret = [];
        for (var ni = piArr.length , i = 0; i < ni; i++)
        {
            var pi = piArr[ i ];

            if (pi.sign < 0)    
                ret.push( '-' );
            
            else if (ret.length)                
                ret.push( '+' );

            ret.push( pi.e instanceof Array
                      ? (pi.e.__isExpr__  ?  pi.e  :   expr.apply( null, pi.e ) )
                      : pi.e
                    );
        }
        return ret;
    }

    function simplify_a_bit_minus_expr_using_idnum2count( idnum2expr, tmp_idnum2count )
    {
        for (var idnum in tmp_idnum2count) { if (!(idnum in _empty)) {

            var e = idnum2expr[ idnum ]
            ,  se
            ,  sid
            ;
            if (e.length === 2  &&  e[ 0 ] === '-'  &&  (se = e[ 1 ]).__isExpr__  &&  2 > tmp_idnum2count[ sid = se.__exprIdnum__ ])
            {
                delete idnum2expr[ sid ];
                delete tmp_idnum2count[ sid ];
                e.splice( 0, e.length );
                e.push.apply( e, getNegArr( se ) );
            }
        }}
    }

    function try_to_save_a_few_sign_inversions_where_beneficial( idnum2expr, tmp_idnum2count, tmp_idnum2usage )
    {
        ((tmp_idnum2usage  &&  tmp_idnum2count)  ||  null).hasOwnProperty.call.a;  // Both must be non-null objects.

        for (var idnum in idnum2expr) { if (!(idnum in _empty)) {
        
            if (!(tmp_idnum2count[ idnum ]))
                continue;

            var  e = idnum2expr[ idnum ]
            , info = getNegativeSumInfo( e )
            ;
            if (!(e.__isExpr__  &&  info.isNegativeSum))
                continue;
                
            for (var i = info.terms.length; i--;)
            {
                var term = info.terms[ i ];
                if (!(term  &&  term.__isExpr__))
                    continue;
                
                var tid  = term.__exprIdnum__
                ,   tsuc = getTermSignUsageCount( tmp_idnum2usage[ tid ], term )
                ;
                if (!(tsuc.n_full_negative > tsuc.n_alone_positive))
                    continue;

                if ('number' === typeof term[ 0 ]  &&  term[ 0 ] > 0)
                    continue;

                var termUsageArr = tmp_idnum2usage[ tid ]
                ,   allUsageExpr = termUsageArr.reduce( function (a,b) { return a  &&  b.__isExpr__; }, true )
                ;
                if (!allUsageExpr)
                    continue;
                
                // Change the sign of this term...
                
                var negArr = getNegArr( term );
                
                term.splice( 0, term.length );
                term.push.apply( term, negArr );

                // ...and change the corresponding sign in usages of that term.

                for (var j = termUsageArr.length; j--;)
                {
                    var ue = termUsageArr[ j ];
                    for (var k = ue.length; k--;)
                    {
                        var uek = ue[ k ];
                        if (uek !== term)
                            continue;

                        var uek_m_1 = ue[ k - 1 ];

                        if (uek_m_1 === '+')
                            ue[ k - 1 ] = '-';

                        else if (uek_m_1 === '-')
                            ue[ k - 1 ] = '+';

                        else
                            ue.splice( k, 0, '-' );
                    }
                }
            }
            
        }}
    }

    function getTermSignUsageCount( usageArr, term )
    {
        var n_full_negative  = 0
        ,   n_alone_positive = 0
        ;

        for (var i = usageArr.length; i--;)
        {
            var u = usageArr[ i ]
            , nsi = getNegativeSumInfo( u, term )
            ;
            if (nsi.isNegativeSum)
                n_full_negative++;

            else if (nsi.isAlonePositive)
                n_alone_positive++;
        }
        
        return { n_full_negative : n_full_negative, n_alone_positive : n_alone_positive };
    }
    

    function getNegativeSumInfo( e, /*?object?*/term )
    {
        var isNegativeSum   = true
        ,   isAlonePositive
        ,   terms           = []
        ,   n_term_p_used   = 0
        ,   n_term_m_used   = 0
        ;
        
        if (!term  &&  (e.length % 2))
            return { isNegativeSum : false };

        for (var n = e.length, i = n; i--  &&  (isNegativeSum  ||  isAlonePositive);)
        {
            var one = (n - i) % 2
            ,   ei  = e[ i ]
            ,   eip = ei === '+'
            ,   eim = ei === '-'
            ;
            if (!(one  ?  ei  &&  ei.__isExpr__  :  eip  ||  eim))
            {
                isNegativeSum = isAlonePositive = false;
                break;
            }
            
            if (one)
            {
                terms.unshift( ei );
            }
            else if (eim)
            {
                if (ei === term)
                    n_term_m_used++;
            }
            else if (eip)
            {
                isNegativeSum = false;

                if (ei === term)
                    n_term_p_used++;
            }
        }

        if (term)
            isAlonePositive = n_term_p_used === 1  &&  n_term_m_used === 0;
        
        if (isAlonePositive  &&  isNegativeSum)
            throw new Error( 'Bug.' );
        
        // done

        if (!(isNegativeSum  ||  isAlonePositive))
            terms = null;

        return { 
            isNegativeSum     : isNegativeSum
            , isAlonePositive : isAlonePositive
            , terms           : terms
        };
    }
    
})(this);
