
var buffer = new ArrayBuffer( 0x1000 );
var impl = gen( window, {}, buffer );

var input    = new Float64Array( buffer, 0, 4 );
var output_i = new Int32Array( buffer, 4*8, 4 );
var output_f = new Float32Array( buffer, 4*8 + 4*4, 4 );
var output_d = new Float64Array( buffer, 4*8 + 4*4 + 2*8, 2 );

input.set( [ 1.2, 2.7, -3.4, -5.6 ])
console.log( 'input:', input );
impl.cut();
console.log( 'input:', input );
console.log( 'output_i:', output_i );
console.log( 'output_f:', output_f );
console.log( 'output_d:', output_d );

function gen( stdlib, foreign, heap )
{
    "use asm";

    var float64 = new stdlib.Float64Array( heap );
    var int32   = new stdlib.Int32Array( heap );
    var float32 = new stdlib.Float32Array( heap );

    function cut()
    {
        var f = 0.0;
        
        // asm.js cannot compile this
        // int32[ 8 ] = (+float64[ 0 ]) | 0;
        // int32[ 9 ] = (+float64[ 1 ]) | 0;
        // int32[ 10 ] = (+float64[ 2 ]) | 0;
        // int32[ 11 ] = (+float64[ 3 ]) | 0;

        // but asm.js can compile this: cast from double to int
        int32[ 8 ] = ~~float64[ 0 ];
        int32[ 9 ] = ~~float64[ 1 ];
        int32[ 10 ] = ~~float64[ 2 ];
        int32[ 11 ] = ~~float64[ 3 ];

        // And test the cast from int to float
        f = 1.234 * +(int32[ 8 ] | 0);
        float32[ 12 ] = f;
        
        float32[ 13 ] = -3.456 * +(int32[ 9 ] | 0);

        // And test the cast from double to float
        float32[ 14 ] = +10 + float64[ 2 ];
        float32[ 15 ] = +10 + float64[ 3 ];

        // And test the cast from float do double
        float64[ 8 ] = f;
        float64[ 9 ] = f + 130.0;
    }
    
    return { cut : cut };
}
