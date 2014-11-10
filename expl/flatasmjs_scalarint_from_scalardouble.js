/*global expl_flatasmjs_scalarint_from_scalardouble flatorize ArrayBuffer window*/

function expl_flatasmjs_scalarint_from_scalardouble()
// Probably not the most sumingful use(s) of flatorize (already flat)
// BUT useful as a unit test for both flatorize and flatorize+asm.js
{
    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_flatasmjs_scalarint_from_scalardouble;

    //#BEGIN_BODY
    
    var plusone_name = 'plusone'
    ,   plusone = flatorize(
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'a:double->b:int'
        , function (a)
        {
            return flatorize.expr( a, '+', 1.1 );
        }
    )
    ;

    try {
        var plusone_asmjs_name = plusone_name + '_asmjs'
        , plusone_asmjs_gen    = flatorize.getAsmjsGen( { switcher : plusone, name : plusone_asmjs_name } )
        ;
    } catch (e) {
     
        if (!(-1 < ('' + e).indexOf( 'Only one basic type permitted' )))
            throw e;
    }
    
    // --- Do they work?

    var   input = 3.456

    ,  expected = input + 1.1                    // `flatorize` disregards the type declarations

    ;
    
    // flatorized version

    var obtained = plusone( input );
    
    // flatorized+asm.js version: not allowed because of type mismatch
    
    //#END_BODY

    // More exports

    E[ plusone_name ] = plusone;

    // For `expl_run`

    return { name : 'plusone'
             , obtained : { flatorize : obtained
                          }
             
             , expected : { flatorize : expected
                          }
             , input : input 
           };
}
