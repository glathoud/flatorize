/*
  ECMAScript implementation of "flatorize": Generate fast, flat,
  factorized ** C code ** for mathematical expressions.

  Requires: ./flatorize_c.js  and  ./examples.js
  
  Copyright 2013 Guillaume Lathoud
  
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  
  http://www.apache.org/licenses/LICENSE-2.0
  
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  
  A copy of the Apache License Version 2.0 as of February 20th, 2013
  can be found in the file ./LICENSE.TXT
*/

// -*- coding: utf-8 -*-

/*global flatorize flatorize_c cadd csub cpol cmul cplx load
dft_sr_exprgenF
*/

if ('undefined' === typeof flatorize_c  &&  'function' === typeof load)
    load( 'flatorize_c.js' );  // e.g. V8

if ('undefined' === typeof cadd         &&  'function' === typeof load)
    load( 'examples.js' );  // e.g. V8


function dft_sr_exprgenF( radix, /*?object?*/opt )
// *Express* the Discrete Fourier Transform (DFT) for a 4-radix (N ==
// 1 << radix) using the split-radix FFT (Algorithm 1 in [Johnson &
// Frigo, TSP 2007]).
//
// Options: `opt = { real : true | false (default), hermihalf : true | false (default), true only makes sense when real==true as well }`
{
    var      real = opt && opt.real
    ,   hermihalf = opt && opt.hermihalf
    ,        Ntop = 1 << radix
    ,          FZ = flatorize
    ;

    return exprfun;

    function exprfun(/*string*/arrname)
    {
        return hermihalf
            ? splitfft( Ntop, arrname, 0, 1).slice( 0, 1 + (Ntop >> 1) )
            : splitfft( Ntop, arrname, 0, 1 )
        ;
    }

    function splitfft( N, arrname, shift, mul )
    // Returns an array of code expressions, one for each point of the
    // DFT output (array length: 2^radix).
    {
        var ret;
        if (N === 1)
        {
            // x0: real (single number) or complex (two numbers)
            var x0 = FZ.part( arrname, index( Ntop, shift, mul, 0 ) );  
            ret = [ real  ?  cplx( x0, 0 )  :  x0  ];
        }
        else if (N === 2)
        {
            var x0 = FZ.part( arrname, index( Ntop, shift, mul, 0 ) )
            ,   x1 = FZ.part( arrname, index( Ntop, shift, mul, 1 ) )
            ;
            ret = [ real  ?  cplx( FZ.expr( x0, '+', x1 ), 0 )  :  cadd( x0, x1 ),
                    real  ?  cplx( FZ.expr( x0, '-', x1 ), 0 )  :  csub( x0, x1 )
                  ];
        }
        else
        {
            // Recursion
            var N_2 = N >> 1
            ,   N_4 = N >> 2
            
            ,  u  = splitfft( N_2, arrname, shift,       mul * 2 )
            ,  z  = splitfft( N_4, arrname, shift + mul, mul * 4 )
            ,  zp = splitfft( N_4, arrname, shift - mul, mul * 4 )
            ;
            ret = new Array( N );
            for (var k = 0; k < N_4; k++)
            {
                var wz  = cmul( w(N,  k), z [ k ] )
                ,   wzp = cmul( w(N, -k), zp[ k ] )
                ,  sum  = cadd( wz, wzp )
                , idiff = cmul( cplx( 0, 1 ), csub( wz, wzp ) )
                ;  
                ret[ k ]           = cadd( u[ k ], sum );
                ret[ k +     N_2 ] = csub( u[ k ], sum );
                ret[ k +     N_4 ] = csub( u[ k + N_4 ], idiff );
                ret[ k + 3 * N_4 ] = cadd( u[ k + N_4 ], idiff );
            }
        }
        
        return ret;
    }
        
    function index( Ntop, shift, mul, i )
    {
        var ret = (shift + mul * i) % Ntop;
        return ret < 0  ?  Ntop + ret  :  ret;
    }
    
    function w( N, k )
    {
        var cache = N in w  ?  w[ N ]  :  (w[ N ] = {});
        return k in cache  ?  cache[ k ]  :  (cache[ k ] = cpol.evalnow( 1, -2 * Math.PI * k / N ));
    }
    
}
