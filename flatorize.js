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

(function (global) {

    // ---------- Public API ----------

    global.flatorize = flatorize;

    flatorize.now  = flatorize_now;  // Convenience wrapper around `flatorize`.
    flatorize.expr = expr;    // To build and expression.
    flatorize.part = part;    // To extract a property of an array or object.

    // ---------- Public API implementation ----------

    function part( x, where )
    {
        if ('string' !== typeof x  &&  !x.__isExpr__)   // Try to solve right away
            return x[ where ];

        // Else form an expression string, and wrap it into `expr()` to
        // make it optimizeable (see `gathering` further below).
        var ret = expr( x + '[' + ( 'number' === typeof where  ?  where  :  '"' + where + '"' ) + ']' );

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
        var ret = expr_simplify( Array.prototype.slice.call( arguments ) );

        if (ret.length === 1)
        {
            if (ret[0].__isExpr__  ||  'number' === typeof ret[0])
                return ret[0];
        }
            

        // Try to find an already existing expression that matches.
        var idstr2expr = exprCache.idstr2expr
        ,  idnum2count = exprCache.idnum2count
        ,        idstr = getExprIdstr( ret )
        ;
        if (idstr in idstr2expr)
        {
            ret = idstr2expr[ idstr ];

            // Update the stats
            
            var idnum = ret.__exprIdnum__; 
            idnum2count[ idnum ] = 1 + (idnum in idnum2count  ?  idnum2count[ idnum ]  :  1); // Start counting at 2, i.e. only the duplicates.
        }
        else
        {
            // Not found. Create a new expression object `ret`
            
            ret.__isExpr__ = true;  // not safe against overwrite, but faster than a function
            ret.__toStr__  = function ( /*?object?*/opt, /*?object?*/topopt ) 
            { 
                var part = this.part;
                if (part)
                {
                    var   x = part.x
                    , where = part.where
                    ,   ret = code2str( x, opt, topopt ) + 
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
                    // var ret = this.map( function (x) { return code2str( x, opt ); } ).join(' ');
                    // For performance reasons, implemented using a for loop.
                    
                    var n = this.length
                    , ret = new Array( n )
                    ;
                    for (var i = 0; i < n; i++)
                        ret[ i ] = code2str( this[ i ], opt );
                    ret = ret.join(' ');
                }
                
                if (topopt  &&  topopt.no_paren)
                    return ret;
                
                return /^\(.*\)$/.test( ret )  ?  ret  :  '(' + ret + ')';
            };
            
            // Update the cache

            var idnum = ret.__exprIdnum__ = exprCache.idnum_next++;

            idstr2expr[ idstr ]  = exprCache.idnum2expr[ idnum ] = ret;

            // Update the stats for the children

            for (var n = ret.length, i = 0; i < n; i++)
            {
                var x = ret[ i ];
                if (!x.__isExpr__)
                    continue;

                var x_idnum = x.__exprIdnum__;
                idnum2count[ x_idnum ] = 1 + (x_idnum in idnum2count  ?  idnum2count[ x_idnum ]  :  1); // Start counting at 2, i.e. only the duplicates.
            }
        }    

        // Et voilà

        return ret;
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
                              , idnum2count:  {}
                            };
                
                check_exprgen_if_possible( exprgen );

                var e = exprgen.apply(null,vararr);
                
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
        ,  outType = parse_type( out_nt[ 1 ] )
        ;
        
        return { 
            typed_in_var        : typed_arr_2_obj(  inArr )
            , typed_out_varname : outName
            , typed_out_vartype : outType
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
            return arr;

        for (var i = 2; i--;)
        {
            
            arr = expr_simplify_multiplications( arr );
            arr = expr_simplify_additions( arr );
            arr = expr_simplify_substractions( arr );

        }

        return arr;
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
                    else if (tox_i === 'number'  ||  tox_i === 'boolean')
                        tmp[ i ] = '' + x_i;
                    else
                        throw new Error('getExprIdstr: probably a bug !');
                }
            }
            return tmp.join(' ');
        }
        
        return '' + x;
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
        
        // Input: statistics gathered while creating expressions
        // (implicitely depth-first walk).

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

    function expr_simplify_multiplications( arr )
    {
        arr = [].concat( arr );  // shallow copy
        for (var i = arr.length - 1; 0 < i--;)
        {
            if (arr[i] !== '*')
                continue;

            var next = arr[ i+1 ];
            if (next === 1  ||  next === '1')
            {
                arr.splice( i, 2 );
                continue;
            }
            if (next === 0  ||  next === '0')
            {
                arr.splice( i-1, 3, 0 );
                continue;
            }
            

            if (i > 0)
            {
                var previous = arr[ i-1 ];
                if (previous === 1  ||  previous === '1' )
                {
                    arr.splice( i-1, 2 );
                    continue;
                }
                if (previous === 0  ||  previous === '0')
                {
                    arr.splice( i-1, 3, 0 );
                    continue;
                }
                if (previous === -1  ||  previous === '-1')
                {
                    arr.splice( i-1, 2, '-' );
                    continue;
                }
            }
        }
        return arr;
    }

    function expr_simplify_additions( arr ) 
    {
        arr = [].concat( arr );  // shallow copy
        for (var i = arr.length - 1; 0 < i--;)
        {
            if (arr[i] !== '+')
                continue;

            var next = arr[ i+1 ];
            if (next === 0  ||  next === '0')
            {
                arr.splice( i, 2 );
                continue;
            }

            if (i > 0)
            {
                var previous = arr[ i-1 ];
                if (previous === 0  ||  previous === '0')
                {
                    arr.splice( i-1, 2 );
                    continue;
                }
            }
        }
        return arr;
    }
    
    function expr_simplify_substractions( arr )
    {
        arr = [].concat( arr );  // shallow copy
        for (var i = arr.length - 1; 0 < i--;)
        {
            if (arr[i] !== '-')
                continue;

            var next = arr[ i+1 ];
            if (next === 0  ||  next === '0')
            {
                arr.splice( i, 2 );
                continue;
            }
            if (next === '-')
            {
                arr.splice( i, 2, '+' );
                continue;
            }
            
            if (i > 0)
            {
                var previous = arr[ i-1 ];
                if (previous === 0  ||  previous === '0')
                {
                    if ('number' === typeof next)
                    {
                        arr.splice( i-1, 3, -next );
                        continue;
                    }
                }
            }

            if ('number' === typeof next)
            {
                arr.splice( i, 2, '+', -next );
                continue;
            }
            
        }
        
        return arr;
    }
    
})(this);
