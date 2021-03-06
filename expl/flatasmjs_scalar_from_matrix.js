/*global expl_flatasmjs_scalar_from_matrix flatorize ArrayBuffer window passed_asmjsgen_info*/

var passed_asmjsgen_info;
function expl_flatasmjs_scalar_from_matrix( /*integer*/nrow, /*integer*/ncol )
// Probably not the most sumingful use(s) of flatorize (no fun call)
// BUT useful as a unit test for both flatorize and flatorize+asm.js
{
    var NAME = 'expl_flatasmjs_scalar_from_matrix';

    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_flatasmjs_scalar_from_matrix;

    //#BEGIN_BODY
    
    var matsumflat_name = 'matsumflat' + nrow + 'x' + ncol

    ,   matsumflat = flatorize(
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'mat:[' + nrow + ' [' + ncol + ' double]]->sum:double'
        , function ( matname )
        {
            return !(nrow > 0  &&  ncol > 0)  
                ?  0
                :  flatorize.expr.apply( 
                    null
                    , symbol_sum(
                        symbol_matrixrows( matname, nrow, ncol )
                            .map( symbol_sum )
                    )
                )
            ;
        }
    )

    ,     input = empty_array( nrow ).map( 
        function () { return empty_array( ncol ).map( Math.random ); }
    )
    ,  expected = input.reduce( function (a,b) { return a+b.reduce( function (x,y) { return x+y; } ); }
                                , 0 
                              )
    
    , matsumflat_asmjs_name = matsumflat_name + 'asmjs'
    
    ,   info = (passed_asmjsgen_info  ||  (passed_asmjsgen_info = {}))[ NAME ] = {
        
        cfg : { switcher : matsumflat, name : matsumflat_asmjs_name }

        , input : augment_name_value_array_with_mapping( [
            { name : 'mat',  value : input }
        ] )

        , output : augment_name_value_array_with_mapping( [
            { name : 'sum', value : expected }
        ] )
    }   
    
    , matsumflat_asmjs_gen = flatorize.getAsmjsGen( info.cfg )
    ;

    function symbol_matrixrows( name, nrow, ncol )
    // m := [ [ m[0][0], m[0][1], m[0][2], ... ], 
    //        [ m[1][0], m[1][1], m[1][2], ... ], 
    //        ... 
    //      ]
    {
        return empty_array( nrow ).map( function ( tmp, r ) {

            return empty_array( ncol ).map( function ( tmp, c ) {

                return flatorize.part( flatorize.part( name, r ), c ); // e.g. m[r][c]
            });
        });
    }

    function symbol_sum( arr )
    // sum( arr ) := arr[0] + arr[1] + ...
    {
        return flatorize.expr.apply( null, arr.reduce( symbol_sum_step, [] ) );
        function symbol_sum_step( left, right ) 
        {
            return left.length  ?  left.concat( [ '+', right ] )  :  [ right ]; 
        }
    }

    function empty_array( size )
    {
        return new Array( size ).join( ',' ).split( ',' );
    }
    
    // --- Do they work?

    // flatorized version

    var obtained = matsumflat( input );
    
    // flatorized+asm.js version
    
    var matsumflat_asmjs_buffer = new ArrayBuffer( matsumflat_asmjs_gen.buffer_bytes )
    ,   matsumflat_asmjs_O      = matsumflat_asmjs_gen( this, {}, matsumflat_asmjs_buffer )  // compile
    ,   matsumflat_asmjs        = matsumflat_asmjs_O[ matsumflat_asmjs_name ]

    ,   n2i        = matsumflat_asmjs_gen.array_name2info
    ,   TypedArray = matsumflat_asmjs_gen.TypedArray
   
    ,   matsumflat_asmjs_input_arr    = new TypedArray( matsumflat_asmjs_buffer, n2i.mat.begin_bytes, n2i.mat.n )
    ;
    
    matsumflat_asmjs_input_arr.set( input.reduce( function (a,b) { return a.concat(b); } ) );

    var obtained_asmjs = matsumflat_asmjs();
    
    //#END_BODY

    // More exports

    E[ matsumflat_name ] = matsumflat;

    E[ matsumflat_asmjs_name ] = matsumflat_asmjs;

    // For `expl_run`

    return { name : 'matsumflat'
             , obtained : { flatorize : obtained
                            , flatorize_asmjs : obtained_asmjs
                          }
             
             , expected : { flatorize : expected
                            , flatorize_asmjs : expected
                          }
             , input : input 
           };
}
