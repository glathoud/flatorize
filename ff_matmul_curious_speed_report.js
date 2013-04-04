// Curious speed result in Firefox 19
//
// Context: 
// http://glat.info/flatorize
// http://glat.info/flatorize#matmul

mat_a = [ 1,  2,  3, 4, 
          5,  6,  7, 8,
          9, 10, 11, 12
        ];

mat_b = [ 13, 14,
          15, 16,
          17, 18,
          19, 20
        ];

// In Firefox 19, this code:

mat_c = matmul342( mat_a, mat_b );

// ...ran about 25% SLOWER than this one:

mat_c = matmul_classic( mat_a, mat_b, 3, 4, 2 );


function matmul342(a, b) {
    var
    _0 = a[0]
    , _1 = b[0]
    , _2 = a[1]
    , _3 = b[2]
    , _4 = a[2]
    , _5 = b[4]
    , _6 = a[3]
    , _7 = b[6]
    , _8 = b[1]
    , _9 = b[3]
    , _a = b[5]
    , _b = b[7]
    , _c = a[4]
    , _d = a[5]
    , _e = a[6]
    , _f = a[7]
    , _g = a[8]
    , _h = a[9]
    , _i = a[10]
    , _j = a[11]
    ;
    return [ _0 * _1 + _2 * _3 + _4 * _5 + _6 * _7, _0 * _8 + _2 * _9 + _4 * _a + _6 * _b, _c * _1 + _d * _3 + _e * _5 + _f * _7, _c * _8 + _d * _9 + _e * _a + _f * _b, _g * _1 + _h * _3 + _i * _5 + _j * _7, _g * _8 + _h * _9 + _i * _a + _j * _b ];
}

function matmul_classic( a, b, I, J, K )
{
    var c = new Array( I * K );

    for (var i = I; i--;)
    {
        var a_offset = i * J
        ,   c_offset = i * K
        ;

        for (var k = K; k--;)
        {
            var sum = 0;
            for (var j = J; j--;)
                sum += a[ a_offset + j ] * b[ j * K + k ];
            
            c[ c_offset + k ] = sum;
        }
    }
    return c;
}
