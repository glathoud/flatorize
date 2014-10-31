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
        castwrap_spare                         : castwrap_spare
        , code_and_expr_2_object_with_dep_info : code_and_expr_2_object_with_dep_info
        , complete_with_dependency_information : complete_with_dependency_information
        , declare_variables                    : declare_variables
        , expcode_cast_if_needed               : expcode_cast_if_needed
        , flatten_duplicates                   : flatten_duplicates
        , get_depSortedArr                     : get_depSortedArr
        , insert_output_early                  : insert_output_early
        , max_in_ret_subset                    : max_in_ret_subset
        , name_2_info_side                     : name_2_info_side
        , outarray_code_push_recursive         : outarray_code_push_recursive
        , propagateType                        : propagateType
        , push_nonString                       : push_nonString
        , tryToGetArrayBasicTypeDescription    : tryToGetArrayBasicTypeDescription
    };

    // ---------- Public API implementation 

    var _emptyObj    = {}
    ,   _EXPR_IDNUM  = '__exprIdnum__'
    ,   _EXPR_ISEXPR = '__isExpr__'
    ,   _JS_CODE     = '__code2str_cache_cfgSTAT'
    ;


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

    
    function code_and_expr_2_object_with_dep_info( dupliidnum2varname, idnum, s, e ) 
    {
        return complete_with_dependency_information
        ( 
            { toString : function () { return s; }, idnum : idnum }
            , dupliidnum2varname
            , e
        );
    }


    function complete_with_dependency_information( codeObj, dupliidnum2varname, e )
    {
        var depSortedArr = get_depSortedArr( dupliidnum2varname, e );
        var ret = Object.create( codeObj );
        ret.depSortedArr = depSortedArr;
        ret.depSortedId  = depSortedArr.join( ',' );

        return ret;
    }

    function declare_variables( fixed, state, idnum_arr, /*?object?*/idnum2expr, /*function*/declaration_statement_code )
    {
        idnum2expr  ||  (idnum2expr = fixed.idnum2expr);

        var n = idnum_arr.length;
        if (n)
        {
            var ret = state.ret;

            ret.push( '/* Intermediary calculations: type declarations */' );
            
            for (var i = 0; i < n; i++)
            {
                var idnum  = idnum_arr[ i ]
                ,   d_e    = idnum2expr[ idnum ]
                ,   d_type = fixed.idnum2type[ idnum ]
                ,   d_name = fixed.dupliidnum2varname[ idnum ]
                ;
                d_type.substring.call.a;  // Must be a simple type
                ret.push( declaration_statement_code( d_name, d_type ) );
            }

            state.ret.push( '' );
        }
    }

    function expcode_cast_if_needed( fixed, state, outtype, e, /*?string?*/outname )
    {
        // Mandatory stuff, unless specified otherwise
        
        var idnum2type         = fixed.idnum2type
        ,   dupliidnum2varname = fixed.dupliidnum2varname
        ,   duplicates         = fixed.duplicates
        ,   array_name2info    = fixed.array_name2info

        ,   castwrap           = fixed.castwrap
        ,   read_array_value_expression_code  = fixed.read_array_value_expression_code

        ,  single_common_array_btd = fixed.single_common_array_btd  ||  null  // optional
        
        ,   ret_idnumSet       = state.ret_idnumSet
        ;

        if (single_common_array_btd)
        {
            var sca_name = fixed.sca_name
            ,   sca_type = fixed.sca_type
            ;
            (sca_name  ||  null).substring.call.a;
            (sca_type  ||  null).substring.call.a;
        }
        


        var etype  = idnum2type[ e.__exprIdnum__ ]
        ,   jscode = e[ _JS_CODE ]
        ;
        if (jscode === outname  ||  !outname)
        {
            // e.g. intermediary value
            
            var toe = typeof e;

            if ('number' === toe)
            {
                jscode = '' + e;
            }
            else if ('string' === toe)
            {
                jscode = e;
            }
            else if (!e.part  &&  e.length === 1  &&  'string' === typeof e[ 0 ])
            {
                jscode = e[ 0 ];
            }
            else
            {
                var opt    = { 
                    dupliidnum2varname: dupliidnum2varname
                    , duplicates : duplicates
                };
                
                var topopt = { 
                    do_not_cache: true
                    , no_paren: true
                };
                
                var modified_e = modify_input_access( e );

                jscode = 'string' === typeof modified_e  ?  modified_e  :  e.__toStr__.call( modified_e, opt, topopt );
            }
        }

        return castwrap_spare( castwrap, outtype, jscode );

        function modify_input_access( one )
        {
            var idnum;
            if (one.__isExpr__  &&  (idnum = one.__exprIdnum__) != null  &&  idnum in ret_idnumSet)
            {
                var dupli_varname = dupliidnum2varname[ idnum ];
                (dupli_varname  ||  0).substring.call.a;
                return dupli_varname;
            }
            

            var part = one.part;
            
            if (part)
            {
                for (var name in array_name2info) { if (!(name in _emptyObj)) {   // More flexible than hasOwnProperty

                    var info = array_name2info[ name ]
                    ,   m    = info.matchFun( one )
                    ;
                    if (!m)
                        continue;
                    
                    // Found a matching `part` expression.
                    
                    if (m.partial)
                        null.bug_or_error;  // Things like C's pointer `float*` don't go in asm.js -> flatten multidimensional arrays completely
                    
                    var ind = (single_common_array_btd  ?  info.begin  :  0) + m.flat_ind;
                    if (isNaN( ind )  ||  !(ind.toPrecision))
                        null.bug;

                    var s = read_array_value_expression_code(
                        single_common_array_btd  ?  sca_name  :  name
                        , ind
                    );
                    
                    return castwrap_spare( castwrap, outtype, s );
                }}
            }
            
            var tof_one = typeof one
            , is_one_o  = 'object' === tof_one
            , is_one_expr = is_one_o  &&  one.__isExpr__
            ;

            var      idnum = is_one_expr  &&  one  &&  one.__exprIdnum__
            , duplivarname = idnum  &&  idnum in ret_idnumSet  &&  dupliidnum2varname[ idnum ]
            ;
            if (duplivarname)
                return duplivarname;
            
            if (is_one_expr)
                return one.__toStr__.call( one.map( modify_input_access ), opt, topopt );

            if (tof_one === 'number')
                return castwrap_spare( castwrap, outtype, '' + one );
            
            return one;
        }
    }


    function flatten_duplicates( duplicates, idnum2expr, array_name2info, /*function*/castwrap, /*?string?*/sca_name, /*?string?*/sca_type )
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
        var sca = sca_name  ||  sca_type;
        
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
                    
                    var ind = (sca  ?  info.begin  :  0) + m.flat_ind;
                    if (isNaN( ind )  ||  !(ind.toPrecision))
                        null.bug;
                    
                    e.length = 1;

                    var varname = sca  ?  sca_name  :  name
                    ,   vartype = sca  ?  sca_type  :  info.type
                    ;
                    (varname  ||  null).substring.call.a;
                    (vartype  ||  null).substring.call.a;

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


    function get_depSortedArr( dupliidnum2varname, e )
    {
        var depSortedArr = [];
        for (var n = e.length , i = 0; i < n; i++)
        {
            var ei = e[ i ];
            if (ei.__isExpr__)
            {
                var idnum = ei.__exprIdnum__;
                idnum.toPrecision.call.a;  // Must be a number

                if (idnum in dupliidnum2varname)
                    depSortedArr.push( idnum );
                else
                    depSortedArr.push.apply( depSortedArr, get_depSortedArr( dupliidnum2varname, ei ) );
            }
        }
        depSortedArr.sort( function (a,b) { return a < b  ?  -1  :  +1; } );
        return depSortedArr;
    }

    function insert_output_early( state, e, code )
    // Assumption: expr id num increases bottom-up with the
    // construction (construct id num > all idnums of construct's
    // dependencies).
    //
    // Goal: reduce register spill by using intermediary variables
    // as soon as possible == write the related output lines as
    // early as possible.
    {
        var max = FTU.max_in_ret_subset( e, state.ret_idnumSet, state.idnum2max_in_ret_subset )
        ,   ret = state.ret
        ;
        
        if (max < state.ret_idnumMax)
        {
            for (var n = ret.length, i = n; i--;)
            {
                if (ret[ i ].idnum <= max)
                {
                    ret.splice( i + 1, 0, code );
                    return;
                }
            }
        }
        
        ret.push( code );
    }


    function max_in_ret_subset( e, ret_idnumSet, idnum2max_in_ret_subset )
    // Recursive deep evaluation of the maximum expression id used
    // in `e` that is within the subset of already "written"
    // intermediary code.
    //
    // Return -Infinity or an integer `idnum`.
    {
        var tmpMax = -Infinity;
        
        if (e.__isExpr__)
        {
            var e_idnum = e.__exprIdnum__;
            if (e_idnum != null)
            {
                if (e_idnum in ret_idnumSet)
                    return e_idnum;

                if (e_idnum in idnum2max_in_ret_subset)
                    return idnum2max_in_ret_subset[ e_idnum ];

                for (var k = e.length; k--;)
                {
                    var    ek = e[ k ];
                    if (ek.__isExpr__)
                    {
                        var idnum = ek.__exprIdnum__;
                        idnum.toPrecision.call.a;
                        
                        if (idnum in ret_idnumSet)
                        {
                            if (idnum > tmpMax)
                                tmpMax = idnum;
                        }
                        else
                        {
                            tmpMax = Math.max( tmpMax, max_in_ret_subset( ek, ret_idnumSet, idnum2max_in_ret_subset ) );
                        }
                    }
                }

                idnum2max_in_ret_subset[ e_idnum ] = tmpMax;
            }
        }
        
        return tmpMax;
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

    function outarray_code_push_recursive( fixed, state, e, /*?boolean?*/do_insert_output_early )
    {
        do_insert_output_early != null  ||  (do_insert_output_early = true);
        
        //
        
        var basictype = fixed.bt_out.type;
        (basictype || null).substring.call.a;  // Must be a string

        var outvar_info = fixed.array_name2info[ fixed.typed_out_varname ]
        ,  outvar_begin = outvar_info.begin
        ,  flatIndFun   = outvar_info.flatIndFun
        ;
        outvar_begin.toPrecision.call.a;
        (flatIndFun  ||  null).call.a;

        var write_array_value_statement_code = fixed.write_array_value_statement_code;
        (write_array_value_statement_code  ||  null).call.a;

        var sca_name = fixed.sca_name;
        (sca_name  ||  null).substring.call.a;

        var ret = state.ret;
        ret.push.call.a;

        // 

        outarray_code_push_recursive_impl( e, [] );

        // --- Details

        function outarray_code_push_recursive_impl( arr, ind_arr )
        {
            arr.concat.call.a;  // Must be an array
            ind_arr.concat.call.a;  // Must be an array

            var d = 1 + ind_arr.length
            , dim = outvar_info.dim
            ,   n = arr.length
            ;
            for (var i = 0; i < n; i++)
            {
                var arr_i = arr[ i ]
                ,   ia2   = ind_arr.concat( i )
                ;
                
                if (d < dim)
                {
                    outarray_code_push_recursive_impl( arr_i, ia2 );
                }
                else
                {
                    var ind = outvar_begin + flatIndFun( ia2 );
                    ('number' === typeof ind  &&  !isNaN( ind )  &&  isFinite( ind ))  ||  null.error;

                    var code = write_array_value_statement_code
                    (
                        sca_name
                        , ind
                        , expcode_cast_if_needed( fixed, state, basictype, arr_i )
                    );
                   
                    if (do_insert_output_early)
                        insert_output_early( state, arr_i, code );
                    else
                        ret.push( code );
                }
            }
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


    function push_nonString( /*object*/state, /*number*/idnum, /*object*/x )
    // Updates `state.ret` and associated properties.
    {
        if ('string' === typeof x)
            null.bug;
        
        state.ret.push( x );

        state.ret_idnumSet[ idnum ] = 1;
        
        state.ret_idnumMax = Math.max( state.ret_idnumMax, idnum );
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
