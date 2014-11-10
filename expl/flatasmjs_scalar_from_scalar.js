/*global expl_flatasmjs_scalar_from_scalar flatorize ArrayBuffer window*/

function expl_flatasmjs_scalar_from_scalar()
// Probably not the most sumingful use(s) of flatorize (already flat)
// BUT useful as a unit test for both flatorize and flatorize+asm.js
{
    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_flatasmjs_scalar_from_scalar;

    //#BEGIN_BODY
    
    var plusone_name = 'plusone'
    ,   plusone = flatorize(
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'a:double->b:double'
        , function (a)
        {
            return flatorize.expr( a, '+', 1 );
        }
    )

    , plusone_asmjs_name = plusone_name + '_asmjs'
    , plusone_asmjs_gen  = flatorize.getAsmjsGen( { switcher : plusone, name : plusone_asmjs_name } )
    ;
    
    // --- Do they work?

    var   input = 3
    ,  expected = input + 1
    ;
    
    // flatorized version

    var obtained = plusone( input );
    
    // flatorized+asm.js version
    
    var plusone_asmjs_buffer = new ArrayBuffer( plusone_asmjs_gen.buffer_bytes )
    ,   plusone_asmjs_O      = plusone_asmjs_gen( this, {}, plusone_asmjs_buffer )  // compile
    ,   plusone_asmjs        = plusone_asmjs_O[ plusone_asmjs_name ]
    ;
    
    var obtained_asmjs = plusone_asmjs( input );
    
    //#END_BODY

    // More exports

    E[ plusone_name ] = plusone;

    E[ plusone_asmjs_name ] = plusone_asmjs;

    // For `expl_run`

    return { name : 'plusone'
             , obtained : { flatorize : obtained
                            , flatorize_asmjs : obtained_asmjs
                          }
             
             , expected : { flatorize : expected
                            , flatorize_asmjs : expected
                          }
             , input : input 
           };
}
