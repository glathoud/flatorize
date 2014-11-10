/*global expl_flatasmjs_matrix_from_array flatorize ArrayBuffer window*/

function expl_flatasmjs_matrix_from_array( /*integer*/size )
// Probably not the most sumingful use(s) of flatorize (already flat)
// BUT useful as a unit test for both flatorize and flatorize+asm.js
{
    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_flatasmjs_matrix_from_array;

    //#BEGIN_BODY

    var col_factor = Math.pow( 10, Math.ceil( Math.log( size ) / Math.log( 10 ) ) )

    ,   v2m_name = 'v2m'
    ,   v2m      = flatorize(
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'arr:[' + size + ' double]->mat:[' + size + ' [' + size + ' double]]'
        , function ( arrname )
        {
            return symbol_matmulrows_zip(
                transpose(
                    /*matrix:*/ [
                        symbol_array( arrname, size )
                            .map( function ( x, i ) { return flatorize.expr( x, '*', i ) } )
                    ]
                )
                , /*matrix:*/ [
                    symbol_array( arrname, size )
                        .map( function ( x, i ) { return flatorize.expr( x, '+', i / col_factor ); } )
                ]
            );
        }
    )
    
    ,   v2m_asmjs_name = v2m_name + '_asmjs'
    ,   v2m_asmjs_gen  = flatorize.getAsmjsGen( { switcher : v2m, name : v2m_asmjs_name } )
    ;

    // --- Do they work?

    var  input = empty_array( size ).map( Math.random )

    , expected = empty_array( size ).map( 
        function ( tmp, irow ) 
        {
            return empty_array( size ).map( 
                function ( tmp, icol ) 
                {
                    return (input[ irow ] * irow) * (input[ icol ] + icol / col_factor);
                }
            );
        }
    )
    ; 
    
    // flatorized version

    var obtained = v2m( input );
    
    // flatorized+asm.js version
    
    var v2m_asmjs_buffer = new ArrayBuffer( v2m_asmjs_gen.buffer_bytes )
    ,   v2m_asmjs_O      = v2m_asmjs_gen( this, {}, v2m_asmjs_buffer )  // compile
    ,   v2m_asmjs        = v2m_asmjs_O[ v2m_asmjs_name ]

    ,   n2i        = v2m_asmjs_gen.array_name2info
    ,   TypedArray = v2m_asmjs_gen.TypedArray
   
    ,   v2m_asmjs_input_arr  = new TypedArray( v2m_asmjs_buffer, n2i.arr.begin_bytes,  n2i.arr.n )
    ,   v2m_asmjs_output_mat = new TypedArray( v2m_asmjs_buffer, n2i.mat.begin_bytes, n2i.mat.n )
    ;
    
    v2m_asmjs_input_arr.set( input );

    v2m_asmjs();

    var obtained_asmjs = [].slice.apply( v2m_asmjs_output_mat );

    // --- Details

    function symbol_matmulrows_zip( a, b )
    {
        return a.map( function (ra) { 

            return transpose( b ).map( function (cb) {

                return symbol_sum( 
                    zip( ra, cb )
                        .map( function (xy) { 
                            return flatorize.expr( xy[ 0 ], '*', xy[ 1 ] ); 
                        } )
                );
            } );
        } );
    }

    function transpose( mat )
    {
        return zip.apply( null, mat );
    }
    
    function zip(/*...arguments...*/)
    {
        var arg = [].slice.apply( arguments );
        if (!arg.length)
            return [];
        
        var n = arg[ 0 ].length
        , ret = new Array( n )
        ;
        for (var i = 0; i < n; i++)
            ret[ i ] = arg.map( function (x) { return x[i]; } );
        
        return ret;
    }
    
    function symbol_matrixrows( name, nrow, ncol )
    // m := [ [ m[0][0], m[0][1], m[0][2], ... ], 
    //        [ m[1][0], m[1][1], m[1][2], ... ], 
    //        ... 
    //      ]
    {
        var ret = new Array( nrow );
        for (var r = 0; r < nrow; r++)
            ret[ r ] = symbol_array( flatorize.part( name, r ), ncol );  // e.g. m[r]

        return ret;
    }

    function symbol_array( arrname, size )
    // arr := [ arr[0], arr[1], arr[2], ... ]
    {
        return empty_array( size )
            .map( function ( tmp, i ) { return flatorize.part( arrname, i ); } )
        ;
    }

    function empty_array( size )
    {
        return new Array( size ).join( ',' ).split( ',' );
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
   
    //#END_BODY

    // More exports

    E[ v2m_name ] = v2m;

    E[ v2m_asmjs_name ] = v2m_asmjs;

    // For `expl_run`

    return { name : 'v2m'
             , obtained : { flatorize : obtained
                            , flatorize_asmjs : obtained_asmjs
                          }
             
             , expected : { flatorize : expected
                            , flatorize_asmjs : expected.reduce( function (a,b) { return a.concat(b); } )
                          }
             , input : input 
           };
}
