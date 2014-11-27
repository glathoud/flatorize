/*global expl_flatasmjs_matrix_from_scalar flatorize ArrayBuffer window passed_asmjsgen_info*/

var passed_asmjsgen_info;
function expl_flatasmjs_matrix_from_scalar( /*integer*/nrow, /*integer*/ncol )
// Probably not the most sumingful use(s) of flatorize (already flat)
// BUT useful as a unit test for both flatorize and flatorize+asm.js
{
    var NAME = 'expl_flatasmjs_matrix_from_scalar';

    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_flatasmjs_matrix_from_scalar;

    //#BEGIN_BODY

    var factor = Math.pow( 10, Math.ceil( Math.log( Math.max( nrow, ncol ) ) / Math.log( 10 ) ) )

    ,   s2m_name = 's2m'
    ,   s2m      = flatorize(
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'x:double->mat:[' + nrow + ' [' + ncol + ' double]]'
        , function ( x_name )
        {
            return empty_array( nrow ).map(
                function ( tmp, irow )
                {
                    return empty_array( ncol ).map(
                        function ( tmp, icol )
                        {
                            return flatorize.expr( 
                                x_name, '+', (irow + icol / factor) / factor
                            );
                        }
                    );
                }
            );
        }
    )


    ,    input = 1234.56789

    , expected = empty_array( nrow ).map( 
        function ( tmp, irow ) 
        {
            return empty_array( ncol ).map( 
                function ( tmp, icol ) 
                {
                    return input + (irow + icol / factor) / factor;
                }
            );
        }
    )
    

    ,   s2m_asmjs_name = s2m_name + '_asmjs'

    ,   info = (passed_asmjsgen_info  ||  (passed_asmjsgen_info = {}))[ NAME ] = {
        
        cfg : { switcher : s2m, name : s2m_asmjs_name }

        , input : augment_name_value_array_with_mapping( [
            { name : 'x',  value : input }
        ] )

        , output : augment_name_value_array_with_mapping( [
            { name : 'mat', value : expected }
        ] )
    }


    
    
    ,   s2m_asmjs_gen  = flatorize.getAsmjsGen( info.cfg )
    ;

    function empty_array( size )
    {
        return new Array( size ).join( ',' ).split( ',' );
    }

    // --- Do they work?

    // flatorized version

    var obtained = s2m( input );
    
    // flatorized+asm.js version
    
    var s2m_asmjs_buffer = new ArrayBuffer( s2m_asmjs_gen.buffer_bytes )
    ,   s2m_asmjs_O      = s2m_asmjs_gen( this, {}, s2m_asmjs_buffer )  // compile
    ,   s2m_asmjs        = s2m_asmjs_O[ s2m_asmjs_name ]

    ,   n2i        = s2m_asmjs_gen.array_name2info
    ,   TypedArray = s2m_asmjs_gen.TypedArray
   
    ,   s2m_asmjs_output_mat = new TypedArray( s2m_asmjs_buffer, n2i.mat.begin_bytes, n2i.mat.n )
    ;
    
    s2m_asmjs( input );

    var obtained_asmjs = [].slice.apply( s2m_asmjs_output_mat );

    //#END_BODY

    // More exports

    E[ s2m_name ] = s2m;

    E[ s2m_asmjs_name ] = s2m_asmjs;

    // For `expl_run`

    return { name : 's2m'
             , obtained : { flatorize : obtained
                            , flatorize_asmjs : obtained_asmjs
                          }
             
             , expected : { flatorize : expected
                            , flatorize_asmjs : expected.reduce( function (a,b) { return a.concat(b); } )
                          }
             , input : input 
           };
}
