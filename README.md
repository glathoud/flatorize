flatorize
=========

Generate fast implementations of mathematical expressions.

(See also the [slides](bpjs2014/index.html) and [video](http://www.youtube.com/watch?v=FxNNSvNDbW8) from the Budapest 2014 bpjs/node.js meetup.)

## Idea

Think like this:

```     
Matrix multiplication a * b: Each row of a with each column of b
```

...write code like you think, without caring about performance...

```python
# Python   c = a * b
c = [[ sum(x*y for x,y in zip(ra,cb)) for cb in zip(*b) ] for ra in a ]
```

```js
// JavaScript
function matmulrows_zip( a, b )
{
    return a.map( function (ra) { 
        return zip.apply( null, b ).map( function (cb) {
            return sum( 
                zip( ra, cb )
                    .map( function (xy) { return xy[ 0 ] * xy[ 1 ]; } )
            );
        } );
    } );
}

// --> Well encapsulated code, but slow due to function call overhead.
```

...and let flatorize transform the above into very fast JavaScript code:

```
// Generated "flatorized" code == factorized + flattened
// 
// - factorized: avoid repeating computations.
// - flattened:  no function call.

function anonymous(a, b) {
/* function (a,b) { return symbol_matmulrows_zip_gen( a, b, 3, 4, 2 ); } */
var
  _0 = a[0]
, _1 = _0[0]
, _2 = _0[1]
, _3 = _0[2]
, _4 = _0[3]
, _5 = a[1]
, _6 = _5[0]
, _7 = _5[1]
, _8 = _5[2]
, _9 = _5[3]
, _a = a[2]
, _b = _a[0]
, _c = _a[1]
, _d = _a[2]
, _e = _a[3]
, _f = b[0]
, _g = _f[0]
, _h = _f[1]
, _i = b[1]
, _j = _i[0]
, _k = _i[1]
, _l = b[2]
, _m = _l[0]
, _n = _l[1]
, _o = b[3]
, _p = _o[0]
, _q = _o[1]
;
return [ [ (_1 * _g) + (_2 * _j) + (_3 * _m) + (_4 * _p), (_1 * _h) + (_2 * _k) + (_3 * _n) + (_4 * _q) ], [ (_6 * _g) + (_7 * _j) + (_8 * _m) + (_9 * _p), (_6 * _h) + (_7 * _k) + (_8 * _n) + (_9 * _q) ], [ (_b * _g) + (_c * _j) + (_d * _m) + (_e * _p), (_b * _h) + (_c * _k) + (_d * _n) + (_e * _q) ] ];

}
```

Speedups exceed +1000% in many cases, including matrix multiplication and the Discrete Fourier Transform (full results).

A plugin permits to generate fast C code as well. See [./c_code.html] (c_code.html).

I am currently working on an extension for asm.js, including multidimensional arrays. See [./asmjs.html](asmjs.html)

## More

For more details see the article:
 * Download this repository and open [./index.html](index.html)
 * or the live site: [//glat.info/flatorize](//glat.info/flatorize)

