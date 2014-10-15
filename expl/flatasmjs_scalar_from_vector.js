/*global expl_scalar_from_vector flatorize ArrayBuffer window*/

function expl_flatasmjs_scalar_from_vector( /*integer*/size )
// Probably not the most sumingful use(s) of flatorize (already flat)
// BUT useful as a unit test for both flatorize and flatorize+asm.js
{
    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_flatasmjs_scalar_from_vector;

    //#BEGIN_BODY
    
    var sumflat = flatorize(
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'arr:[' + size + ' double]->sum:double'
        , function (arrname)
        {
            return !(size > 0)  
                ?  0
                :  flatorize.expr.apply( 
                    null
                    , new Array( size ).join( ',' ).split( ',' )
                        .map( function (tmp, i) { return flatorize.part( arrname, i ); } )
                        .reduce( function (left, right) { return left.concat( left.length  ?  [ '+' ]  :  [] ).concat( [ right ] ); }, [] )
                )
            ;
        }
    )

    , sumflat_asmjs_name = 'sumflat' + size + 'asmjs'
    , sumflat_asmjs_gen = flatorize.getAsmjsGen( { switcher : sumflat, name : sumflat_asmjs_name } )
    ;
    
    // --- Do they work?

    var   input = new Array( size ).join(',').split(',').map( Math.random )
    ,  expected = input.reduce( function (a,b) { return a+b; } )
    ;
    
    // flatorized version

    var obtained = sumflat( input );
    
    // flatorized+asm.js version
    
    var sumflat_asmjs_buffer = new ArrayBuffer( sumflat_asmjs_gen.buffer_bytes )
    ,   sumflat_asmjs_O      = sumflat_asmjs_gen( window, {}, sumflat_asmjs_buffer )  // compile
    ,   sumflat_asmjs        = sumflat_asmjs_O[ sumflat_asmjs_name ]

    ,   n2i        = sumflat_asmjs_gen.array_name2info
    ,   TypedArray = sumflat_asmjs_gen.TypedArray
   
    ,   sumflat_asmjs_input_arr    = new TypedArray( sumflat_asmjs_buffer, n2i.arr.begin_bytes, n2i.arr.n )
    ;
    
    sumflat_asmjs_input_arr.set( input );

    var obtained_asmjs = sumflat_asmjs();
    
    //#END_BODY

    // More exports

    E[ 'sumflat' + size ] = sumflat;

    E[ sumflat_asmjs_name ] = sumflat_asmjs;

    // For `expl_run`

    return { name : 'sumflat'
             , obtained : { flatorize : obtained
                            , flatorize_asmjs : obtained_asmjs
                          }
             
             , expected : { flatorize : expected
                            , flatorize_asmjs : expected
                          }
             , input : input 
           };
}
