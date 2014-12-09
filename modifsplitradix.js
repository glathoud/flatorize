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

/*global flatorize flatorize_c cadd csub cpol cmul cplx conj load
dft_sr_exprgenF
dft_msr_exprgenF
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
                var wz  = cmul( wNk(N,  k), z [ k ] )
                ,   wzp = cmul( wNk(N, -k), zp[ k ] )
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
    
    function wNk( N, k )
    {
        var cache = N in wNk  ?  wNk[ N ]  :  (wNk[ N ] = {});
        return k in cache  ?  cache[ k ]  :  (cache[ k ] = cpol.evalnow( 1, -2 * Math.PI * k / N ));
    }
    
}



function dft_msr_naive_genF( radix, /*?object?*/opt )
// *Implement* the Discrete Fourier Transform (DFT) for a 4-radix (N ==
// 1 << radix) using the modified split-radix FFT (Algorithms 2 and 3
// in [Johnson & Frigo, TSP 2007]).
//
// Naive implementation without any flatorizing. Lots of small
// function calls.
//
// Options: `opt = { real : true | false (default), hermihalf : true | false (default), true only makes sense when real==true as well }`
{
    // Since flatorize implementations (e.g. cplx, cadd, csub etc.)
    // can also be used outside of expression generation, as
    // standalone functions, we do not have to do much work here :)

    return dft_msr_exprgenF( radix, opt );
}



function dft_msr_exprgenF( radix, /*?object?*/opt )
// *Express* the Discrete Fourier Transform (DFT) for a 4-radix (N ==
// 1 << radix) using the modified split-radix FFT (Algorithms 2 and 3
// in [Johnson & Frigo, TSP 2007]).
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
            ? newfft( Ntop, arrname, 0, 1).slice( 0, 1 + (Ntop >> 1) )
            : newfft( Ntop, arrname, 0, 1 )
        ;
    }

    function newfft( N, arrname, shift, mul )
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
            
            ,  u  = newfft ( N_2, arrname, shift,       mul * 2 )
            ,  z  = newfftS( N_4, arrname, shift + mul, mul * 4 )
            ,  zp = newfftS( N_4, arrname, shift - mul, mul * 4 )
            ;
            ret = new Array( N );
            for (var k = 0; k < N_4; k++)
            {
                var wz  = cmul( wsNk(N,  k), z [ k ] )
                ,   wzp = cmul( wsNk(N, -k), zp[ k ] )
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
        
 
    function newfftS( N, arrname, shift, mul )
    // Computes DFT / S_{N,k}
    {
        var ret;
        if (N === 1)
        {
            // x0: real (single number) or complex (two numbers)
            // S_{1,k} = 1 for all k
            var x0 = FZ.part( arrname, index( Ntop, shift, mul, 0 ) );  
            ret = [ real  ?  cplx( x0, 0 )  :  x0  ];
        }
        else if (N === 2)
        {
            // S_{2,k} = 1 for all k
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
            
            ,  u  = newfftS2( N_2, arrname, shift,       mul * 2 )
            ,  z  = newfftS ( N_4, arrname, shift + mul, mul * 4 )
            ,  zp = newfftS ( N_4, arrname, shift - mul, mul * 4 )
            ;
            ret = new Array( N );
            for (var k = 0; k < N_4; k++)
            {
                var  t  = tNk( N, k )
                ,    tc = conj.evalnow( t )
                ,  tz   = cmul( t,   z[ k ] )
                ,  tczp = cmul( tc, zp[ k ] )
                ,  sum  = cadd( tz, tczp )
                , idiff = cmul( cplx( 0, 1 ), csub( tz, tczp ) )
                ;  
                ret[ k ]           = cadd( u[ k ], sum );
                ret[ k +     N_2 ] = csub( u[ k ], sum );
                ret[ k +     N_4 ] = csub( u[ k + N_4 ], idiff );
                ret[ k + 3 * N_4 ] = cadd( u[ k + N_4 ], idiff );
            }
        }
        
        return ret;
    }



    function newfftS2( N, arrname, shift, mul )
    // Computes DFT / S_{2N,k}
    {
        var ret;
        if (N === 1)
        {
            // x0: real (single number) or complex (two numbers)
            // S_{2,k} = 1 for all k
            var x0 = FZ.part( arrname, index( Ntop, shift, mul, 0 ) );  
            ret = [ real  ?  cplx( x0, 0 )  :  x0  ];
        }
        else if (N === 2)
        {
            // S_{4,k} = 1 for all k
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
            
            ,  u  = newfftS4( N_2, arrname, shift,       mul * 2 )
            ,  z  = newfftS ( N_4, arrname, shift + mul, mul * 4 )
            ,  zp = newfftS ( N_4, arrname, shift - mul, mul * 4 )
            ;
            ret = new Array( N );
            for (var k = 0; k < N_4; k++)
            {
                var  t  = tNk( N, k )
                ,    tc = conj.evalnow( t )
                ,    tz   = cmul( t,   z[ k ] )
                ,    tczp = cmul( tc, zp[ k ] )
                ,  sum_f  = cmul( cadd( tz, tczp ), cplx( sNk( N, k ) / sNk( 2 * N, k ), 0 ) )
                , idiff_f = cmul( csub( tz, tczp ), cplx( 0,                             sNk( N, k ) / sNk( 2 * N, k + N_4 ) ) )
                ;  
                ret[ k ]           = cadd( u[ k ], sum_f );
                ret[ k +     N_2 ] = csub( u[ k ], sum_f );
                ret[ k +     N_4 ] = csub( u[ k + N_4 ], idiff_f );
                ret[ k + 3 * N_4 ] = cadd( u[ k + N_4 ], idiff_f );
            }
        }
        
        return ret;
    }
     
     
    function newfftS4( N, arrname, shift, mul )
    // Computes DFT / S_{4N,k}
    {
        var ret;
        if (N === 1)
        {
            // x0: real (single number) or complex (two numbers)
            // S_{4,k} = 1 for all k
            var x0 = FZ.part( arrname, index( Ntop, shift, mul, 0 ) );  
            ret = [ real  ?  cplx( x0, 0 )  :  x0  ];
        }
        else if (N === 2)
        {
            var x0   = FZ.part( arrname, index( Ntop, shift, mul, 0 ) )
            ,   f0   =  1 / sNk( 4 * N, 0 )
            ,   x1   = FZ.part( arrname, index( Ntop, shift, mul, 1 ) )
            ,   f1   =  1 / sNk( 4 * N, 1 )
            ;
            ret = [ real  ?  cplx( FZ.expr( f0, '*', FZ.expr( x0, '+', x1 ) ), 0 )  :  cmul( cplx( f0, 0 ), cadd( x0, x1 ) ),
                    real  ?  cplx( FZ.expr( f1, '*', FZ.expr( x0, '-', x1 ) ), 0 )  :  cmul( cplx( f1, 1 ), csub( x0, x1 ) )
                  ];
        }
        else
        {
            // Recursion
            var N_2 = N >> 1
            ,   N_4 = N >> 2
            
            ,  u  = newfftS2( N_2, arrname, shift,       mul * 2 )
            ,  z  = newfftS ( N_4, arrname, shift + mul, mul * 4 )
            ,  zp = newfftS ( N_4, arrname, shift - mul, mul * 4 )
            ;
            ret = new Array( N );
            for (var k = 0; k < N_4; k++)
            {
                var  t  = tNk( N, k )
                ,    tc = conj.evalnow( t )
                ,  tz   = cmul( t,   z[ k ] )
                ,  tczp = cmul( tc, zp[ k ] )
                ,  sum  = cadd( tz, tczp )
                , idiff = cmul( cplx( 0, 1 ), csub( tz, tczp ) )
                ;  
                ret[ k ]           = cmul( cadd( u[ k ], sum ),         cplx( sNk( N, k ) / sNk( 4*N, k ),           0 ) );
                ret[ k +     N_2 ] = cmul( csub( u[ k ], sum ),         cplx( sNk( N, k ) / sNk( 4*N, k + N_2 ),     0 ) );
                ret[ k +     N_4 ] = cmul( csub( u[ k + N_4 ], idiff ), cplx( sNk( N, k ) / sNk( 4*N, k + N_4 ),     0 ) );
                ret[ k + 3 * N_4 ] = cmul( cadd( u[ k + N_4 ], idiff ), cplx( sNk( N, k ) / sNk( 4*N, k + 3 * N_4 ), 0 ) );
            }
        }
        
        return ret;
    }
     
     
   
 

   function index( Ntop, shift, mul, i )
    {
        var ret = (shift + mul * i) % Ntop;
        return ret < 0  ?  Ntop + ret  :  ret;
    }
    
    function wNk( N, k )
    {
        var cache = N in wNk  ?  wNk[ N ]  :  (wNk[ N ] = {});
        return k in cache  ?  cache[ k ]  :  (cache[ k ] = cpol.evalnow( 1, -2 * Math.PI * k / N ));
    }


    function wsNk( N, k )
    {
        var cache = N in wsNk  ?  wsNk[ N ]  :  (wsNk[ N ] = {});
        return k in cache  ?  cache[ k ]  :  (cache[ k ] = cmul.evalnow( wNk( N, k ), cplx.evalnow( sNk( N / 4, Math.abs( k ) ), 0 ) ) );
    }

    function sNk( N, k )
    {
        var cache = N in sNk  ?  sNk[ N ]  :  (sNk[ N ] = {});
        
        if (k in cache)
            return cache[ k ];

        var ret;
        if (N <= 4)
        {
            ret = 1;
        }
        else
        {
            var N_4 = N / 4
            ,   k4  = k % N_4
            ;
            ret = sNk( N_4, k4 ) * Math[ k4 <= N/8 ? 'cos' : 'sin' ]( 2 * Math.PI * k4 / N );
        }

        return cache[ k ] = ret;
    }

    function tNk( N, k )
    {
        var cache = N in tNk  ?  tNk[ N ]  :  (tNk[ N ] = {});
        return k in cache  ?  cache[ k ]  :  (cache[ k ] = cmul.evalnow( wNk( N, k ), cplx( sNk( N / 4, k ) / sNk( N, k ), 0 ) ));
    }
    
}
