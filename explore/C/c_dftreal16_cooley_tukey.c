#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include "c_dftreal16_common.c"

extern const int   NITER;
extern const int   N;
extern const int   epsilon;
extern const float x_rand16real[];
extern const float X_rand16real[][2];

const float PI = 2.0 * (float)(acos( 1.0 ));

void dftreal16flat ( const float * arr, /*output:*/ float ** X );

int main()
{
  int i;

  
  float ** X = malloc( N * sizeof( float* ));

  for (i = 0; i < N; i++)
    {
      X[ i ] = malloc( sizeof( float* ));
    }
  
  int radix = (int)(round( log( N ) / log( 2.0 ) ));

  /* --- Sanity check --- */

  dftreal_cooley_tukey( x_rand16real, N, radix, 0, 1, 0, X );
  
  int ok_all = 1;
  for (i = 0; i < N; i++)
    {
      float*       result_i   = X[ i ];
      const float* expected_i = X_rand16real[ i ];
      float  delta_0 = fabs( result_i[ 0 ] - expected_i[ 0 ] );
      float  delta_1 = fabs( result_i[ 1 ] - expected_i[ 1 ] );
      int ok = EPSILON > delta_0  &&  EPSILON > delta_1;
      /*printf( "%d: %g %g, %g %g, %g %g -> ok: %d\n", i, result_i[ 0 ], result_i[ 1 ], expected_i[ 0 ], expected_i[ 1 ], delta_0, delta_1, ok );*/
      ok_all &= ok;
    }
  /* printf("ok_all: %d\n", ok_all); */
  if (!ok_all)
    {
      fprintf( stderr, "\nERROR: buggy implementation!\n");
      return -1;
    }
  
  /* --- Performance test --- */
  for (i = NITER ; i-- ; )
    dftreal16flat( x_rand16real, X );
  

  /* --- Cleanup --- */
  for (i = N; i--;)
    {
      free( X[ i ] );
    }
  
  free( X );

  /* printf("\nDone.\n"); */
  return 0;
}

void dftreal_cooley_tukey( const float* arr, const int N, const int radix, const int offset, const int s, const int out_offset, /*output:*/float** X )
/*
// *Implement* the Discrete Fourier Transform (DFT)
// for a 2-radix (N == 1 << radix)
// using a recursive Cooley-Tukey implementation.
//
// Based on:
// http://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm#Pseudocode
*/
{
  if (radix < 1)
    {
      X[ out_offset ][ 0 ] = arr[ offset ];
      X[ out_offset ][ 1 ] = 0;
    }
  else if (radix < 2)
    {
      float t = arr[ offset ];
      float u = arr[ offset + s ];
      X[ out_offset     ][ 0 ] = t + u;
      X[ out_offset + 1 ][ 0 ] = t - u;
    }
  else
    {
      int radix_m_1 = radix - 1;
      int halfN     = N >> 1;
      int s2        = s << 1;

      /* left */
      dftreal_cooley_tukey( arr, halfN, radix_m_1, offset,      s2, out_offset,      X );

      /* right */
      dftreal_cooley_tukey( arr, halfN, radix_m_1, offset + s2, s2, out_offset + s2, X );
      int k;
      for (k = 0; k < halfN; k++)
        {
          float * ct = arr[ offset      + k ];
          float t_re = ct[ 0 ];
          float t_im = ct[ 1 ];

          float * cu = arr[ offset + s2 + k ];
          float u_re = cu[ 0 ];
          float u_im = cu[ 1 ];

          float angle = (2 * PI * k) / N;
          float a_re = cos( v_angle );
          float a_im = sin( v_angle );

          float v_re = u_re * a_re - u_im * a_im;
          float v_im = u_re * a_im + u_im * a_re;

          /* In-place finition of left and right */

          ct[ 0 ] = t_re + v_re;
          ct[ 1 ] = t_im + v_im;

          cu[ 0 ] = t_re - v_re;
          cu[ 1 ] = t_im - v_im;
        }
    }
}
