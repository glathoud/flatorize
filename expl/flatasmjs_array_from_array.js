/*global expl_array_from_array flatorize ArrayBuffer window*/

function expl_flatasmjs_array_from_array( /*integer*/size )
// Probably not the most sumingful use(s) of flatorize (already flat)
// BUT useful as a unit test for both flatorize and flatorize+asm.js
{
    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_flatasmjs_array_from_array;

    //#BEGIN_BODY
    
    var flip = flatorize(
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'arr:[' + size + ' double]->flipped:[' + size + ' double]'
        , function (arrname)
        {
            return symbol_array( arrname, size ).reverse();
        }
    )
    
    , flip_asmjs_name = 'flip' + size + '_asmjs'
    , flip_asmjs_gen = flatorize.getAsmjsGen( { switcher : flip, name : flip_asmjs_name } )
    ;
    
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

    // --- Do they work?

    var   input = empty_array( size ).map( function (tmp,i) { return i; } )
    ,  expected = input.slice().reverse()
    ;
    
    // flatorized version

    var obtained = flip( input );
    
    // flatorized+asm.js version
    
    var flip_asmjs_buffer = new ArrayBuffer( flip_asmjs_gen.buffer_bytes )
    ,   flip_asmjs_O      = flip_asmjs_gen( this, {}, flip_asmjs_buffer )  // compile
    ,   flip_asmjs        = flip_asmjs_O[ flip_asmjs_name ]

    ,   n2i        = flip_asmjs_gen.array_name2info
    ,   TypedArray = flip_asmjs_gen.TypedArray
   
    ,   flip_asmjs_input_arr      = new TypedArray( flip_asmjs_buffer, n2i.arr.begin_bytes,     n2i.arr.n )
    ,   flip_asmjs_output_flipped = new TypedArray( flip_asmjs_buffer, n2i.flipped.begin_bytes, n2i.flipped.n )
    ;
    
    flip_asmjs_input_arr.set( input );

    flip_asmjs();

    var obtained_asmjs = [].slice.apply( flip_asmjs_output_flipped );
    
    //#END_BODY

    // More exports

    E[ 'flip' + size ] = flip;

    E[ flip_asmjs_name ] = flip_asmjs;

    // For `expl_run`

    return { name : 'flip'
             , obtained : { flatorize : obtained
                            , flatorize_asmjs : obtained_asmjs
                          }
             
             , expected : { flatorize : expected
                            , flatorize_asmjs : expected
                          }
             , input : input 
           };
}
