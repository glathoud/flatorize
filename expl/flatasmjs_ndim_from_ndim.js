/*global expl_flatasmjs_ndim_from_ndim flatorize ArrayBuffer window passed_asmjsgen_info*/

var passed_asmjsgen_info;
function expl_flatasmjs_ndim_from_ndim( /*array of integer*/dim, /*array of integer*/outdim )
// Maybe not the most meaningful use of flatorize, but a good unit
// test for both flatorize and flatorize+asm.js
{
    var ndim2name = { 1 : 'array', 2 : 'matrix' }
    ,   NAME      = 'expl_flatasmjs_' + ndim2name_f( outdim.length ) + '_from_' + ndim2name_f( dim.length )
    ;
    function ndim2name_f( n )
    {
        n.toPrecision.call.a;
        return n in ndim2name  ?  ndim2name[ n ]  :  'ndim_' + n;
    }


    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_flatasmjs_ndim_from_ndim;

    //#BEGIN_BODY

    var n_elt;
    if ((n_elt = prod( dim )) !== prod( outdim ))
        throw new Error( 'reshape requires the same number of elements!' );

    var flipreshapesize = Math.min.apply( Math, dim )
    
    ,  flipreshapeflat_name = 'flipreshapeflat' + dim.join( 'x' )
    ,  flipreshapeflat = flatorize(
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'mat:'  + dim2spec( dim, 'double' ) + '->flipreshape:' + dim2spec( outdim, 'double' )
        , function ( matname )
        {
            return !(n_elt > 0)
                ?  []
                :  ndim_shape( 
                    symbol_flatten( symbol_ndim_matrix( matname, dim ) ).reverse()
                    , outdim
                );
        }
    )


    ,     input = random_ndim_matrix( dim )
    ,  expected = random_ndim_matrix( outdim )
    ;
    
    for (var i = n_elt; i--;)
    {
        var v = ndim_get( input, dim, i );
        ndim_set( expected, outdim, n_elt - 1 - i, v );
    }
    
    var flipreshapeflat_asmjs_name = flipreshapeflat_name + '_asmjs'

    ,   info = (passed_asmjsgen_info  ||  (passed_asmjsgen_info = {}))[ NAME ] = {
        
        cfg : { switcher : flipreshapeflat, name : flipreshapeflat_asmjs_name }

        , input : augment_name_value_array_with_mapping( [
            { name : 'mat',  value : input }
        ] )

        , output : augment_name_value_array_with_mapping( [
            { name : 'flipreshape', value : expected }
        ] )
    }


    ,   flipreshapeflat_asmjs_gen  = flatorize.getAsmjsGen( info.cfg )
    ;

    function prod( arr )
    {
        return arr.length  ?  arr[ 0 ] * prod( arr.slice( 1 ) )  :  1;
    }

    function dim2spec( /*array of integer*/dim, /*string*/basic_type )
    {
        (basic_type || null).substring.call.a;
        return dim.length > 0
            ?  '[' + dim[ 0 ] + ' ' + dim2spec( dim.slice( 1 ), basic_type ) + ']'
            :  basic_type
        ;
    }

    function ndim_shape( array, dim )
    {
        var dim2 = dim.slice()
        ,    ret = array.slice()
        ;
        while (dim2.length > 1)
        {
            var  d  = dim2.pop()
            ,    n  = ret.length
            ,    n2 = n / d
            ;
            if (n2 !== n2 | 0)
                null.bug;
            
            var ret2 = new Array( n2 );
            for (var i = n2; i--;)
                ret2[ i ] = ret.splice( -d );
            
            ret = ret2;
        }
        
        return ret;
    }
    
    function symbol_flatten( /*array | expression | other*/ndim_mat )
    {
        var first = ndim_mat[ 0 ];
        return first instanceof Array  &&  !flatorize.isExpr( first )
            ?  ndim_mat.reduce( function ( a, b ) { return a.concat( symbol_flatten( b ) ); }, [] )
        :  ndim_mat
        ;
    }

    
    function symbol_ndim_matrix( /*string | object*/what, /*array of integer*/dim )
    // 2-dimensional example:
    // 
    // m := [ [ m[0][0], m[0][1], m[0][2], ... ], 
    //        [ m[1][0], m[1][1], m[1][2], ... ], 
    //        ... 
    //      ]
    {
        return !(dim.length > 0)

            ?  what
        
            :  empty_array( dim[ 0 ] ).map( function ( tmp, a ) {

                return symbol_ndim_matrix( flatorize.part( what, a ), dim.slice( 1 ) );
            })
        ;
    }

    function empty_array( size )
    {
        return new Array( size ).join( ',' ).split( ',' );
    }
    
    // --- Do they work?

    function random_ndim_matrix( dim )
    {
        return !(dim.length > 0)
            ?  Math.random()
            :  empty_array( dim[ 0 ] ).map( 
                function () { return random_ndim_matrix( dim.slice( 1 ) ); }
            );
    }
    
    function ndim_get( mat, dim, i )
    {
        var dim_i = i_2_dim_i( dim, i );
        for (var tmp = mat, 
             nd = dim_i.length, id = 0; id < nd; id++
            )
        {
            tmp = tmp[ dim_i[ id ] ];
        }
        return tmp;
    }

    function ndim_set( mat, dim, i, v )
    {
        var dim_i = i_2_dim_i( dim, i );
        for (var tmp = mat, 
             nd_m_1 = dim_i.length - 1, id = 0; id < nd_m_1; id++
            )
        {
            tmp = tmp[ dim_i[ id ] ];
        }
        tmp[ dim_i[ id ] ] = v;
    }

    function i_2_dim_i( dim, i )
    {
        i.toPrecision.call.a;

        var   nd = dim.length
        , offset = dim_2_offset( dim )
        ,  dim_i = new Array( nd )
        ;
        for (var id = 0; id < nd; id++)
        {
            var o_id = offset[ id ];

            dim_i[ id ] = (i / o_id) | 0;

            i %= o_id;
        }
        return dim_i;
    }

    function dim_2_offset( dim )
    {
        var   nd = dim.length
        ,    ret = new Array( nd )
        , offset = 1
        ;
        for (var id = nd; id--;)
        {
            ret[ id ] = offset;
            offset *= dim[ id ];
        }
        return ret;
    }

    function flatten_values( /*array*/ndim_mat )
    {
        return ndim_mat[ 0 ] instanceof Array
            ?  ndim_mat.reduce( function ( a, b ) { return a.concat( flatten_values( b ) ); }, [] )
        :  ndim_mat
        ;
    }
    
    // flatorized version

    var obtained = flipreshapeflat( input );
    
    // flatorized+asm.js version
    
    var flipreshapeflat_asmjs_buffer = new ArrayBuffer( flipreshapeflat_asmjs_gen.buffer_bytes )
    ,   flipreshapeflat_asmjs_O      = flipreshapeflat_asmjs_gen( this, {}, flipreshapeflat_asmjs_buffer )  // compile
    ,   flipreshapeflat_asmjs        = flipreshapeflat_asmjs_O[ flipreshapeflat_asmjs_name ]

    ,   n2i        = flipreshapeflat_asmjs_gen.array_name2info
    ,   TypedArray = flipreshapeflat_asmjs_gen.TypedArray
   
    ,   flipreshapeflat_asmjs_input_mat       = new TypedArray( flipreshapeflat_asmjs_buffer, n2i.mat.begin_bytes,      n2i.mat.n )
    ,   flipreshapeflat_asmjs_output_flipreshape = new TypedArray( flipreshapeflat_asmjs_buffer, n2i.flipreshape.begin_bytes, n2i.flipreshape.n )
    ;
    
    flipreshapeflat_asmjs_input_mat.set( flatten_values( input ) );
    
    flipreshapeflat_asmjs();

    var obtained_asmjs = [].slice.apply( flipreshapeflat_asmjs_output_flipreshape );
    
    //#END_BODY

    // More exports

    E[ flipreshapeflat_name ] = flipreshapeflat;

    E[ flipreshapeflat_asmjs_name ] = flipreshapeflat_asmjs;

    // For `expl_run`

    return { name : 'flipreshapeflat'
             , obtained : { flatorize : obtained
                            , flatorize_asmjs : obtained_asmjs
                          }
             
             , expected : { flatorize : expected
                            , flatorize_asmjs : flatten_values( expected )
                          }
             , input : input 
           };
}
