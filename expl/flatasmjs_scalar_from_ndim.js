/*global expl_flatasmjs_scalar_from_ndim flatorize ArrayBuffer window passed_asmjsgen_info*/

var passed_asmjsgen_info;
function expl_flatasmjs_scalar_from_ndim( /*array of integer*/dim )
// Probably not the most sumingful use(s) of flatorize (no fun call)
// BUT useful as a unit test for both flatorize and flatorize+asm.js
{
    var NAME = 'expl_flatasmjs_scalar_from_ndim_' + dim.length;

    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_flatasmjs_scalar_from_ndim;

    //#BEGIN_BODY
    
    var ndimsumflat_name = 'ndimsumflat' + dim.join( 'x' )

    ,   ndimsumflat = flatorize(
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'mat:' + dim2spec( dim, 'double' ) + '->sum:double'
        , function ( matname )
        {
            return dim.some( function ( d ) { return !(d > 0); } )
                ?  0
                :  flatorize.expr.apply( 
                    null
                    , symbol_ndim_sum(
                        symbol_ndim_matrix( matname, dim )
                    )
                )
            ;
        }
    )

    ,     input = random_ndim_matrix( dim )
    ,  expected = flatten_values( input ).reduce( function ( a, b ) { return a+b; }, 0 )
    
    , ndimsumflat_asmjs_name = ndimsumflat_name + 'asmjs'
    
    ,   info = (passed_asmjsgen_info  ||  (passed_asmjsgen_info = {}))[ NAME ] = {
        
        cfg : { switcher : ndimsumflat, name : ndimsumflat_asmjs_name }

        , input : augment_name_value_array_with_mapping( [
            { name : 'mat',  value : input }
        ] )

        , output : augment_name_value_array_with_mapping( [
            { name : 'sum', value : expected }
        ] )
    }   
    
    , ndimsumflat_asmjs_gen = flatorize.getAsmjsGen( info.cfg )
    ;

    function dim2spec( /*array of integer*/dim, /*string*/basic_type )
    {
        (basic_type || null).substring.call.a;
        return dim.length > 0
            ?  '[' + dim[ 0 ] + ' ' + dim2spec( dim.slice( 1 ), basic_type ) + ']'
            :  basic_type
        ;
    }

    function symbol_ndim_sum( /*array or expression*/x )
    {
        if (!(x instanceof Array)  ||  flatorize.isExpr( x ))
            return x;

        return flatorize.expr.apply( null, x.reduce( symbol_ndim_sum_step, [] ) );

        function symbol_ndim_sum_step( left, right )
        {
            var sns_r = symbol_ndim_sum( right ); // Recursion to a lower dimension.
            return left.length  ?  left.concat( [ '+', sns_r ] )  :  [ sns_r ];
        }
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

    function flatten_values( /*array*/ndim_mat )
    {
        return ndim_mat[ 0 ] instanceof Array
            ?  ndim_mat.reduce( function ( a, b ) { return a.concat( flatten_values( b ) ); }, [] )
        :  ndim_mat
        ;
    }

    // flatorized version

    var obtained = ndimsumflat( input );
    
    // flatorized+asm.js version
    
    var ndimsumflat_asmjs_buffer = new ArrayBuffer( ndimsumflat_asmjs_gen.buffer_bytes )
    ,   ndimsumflat_asmjs_O      = ndimsumflat_asmjs_gen( this, {}, ndimsumflat_asmjs_buffer )  // compile
    ,   ndimsumflat_asmjs        = ndimsumflat_asmjs_O[ ndimsumflat_asmjs_name ]

    ,   n2i        = ndimsumflat_asmjs_gen.array_name2info
    ,   TypedArray = ndimsumflat_asmjs_gen.TypedArray
   
    ,   ndimsumflat_asmjs_input_arr    = new TypedArray( ndimsumflat_asmjs_buffer, n2i.mat.begin_bytes, n2i.mat.n )
    ;
    
    ndimsumflat_asmjs_input_arr.set( flatten_values( input ) );

    var obtained_asmjs = ndimsumflat_asmjs();
    
    //#END_BODY

    // More exports

    E[ ndimsumflat_name ] = ndimsumflat;

    E[ ndimsumflat_asmjs_name ] = ndimsumflat_asmjs;

    // For `expl_run`

    return { name : 'ndimsumflat'
             , obtained : { flatorize : obtained
                            , flatorize_asmjs : obtained_asmjs
                          }
             
             , expected : { flatorize : expected
                            , flatorize_asmjs : expected
                          }
             , input : input 
           };
}
