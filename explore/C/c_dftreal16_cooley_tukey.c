#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include "c_dftreal16_common.c"

extern const int   NITER;
extern const int   N;
extern const int   epsilon;
extern       double PI;
extern const double x_rand16real[];
extern const double X_rand16real[][2];

void dftreal_cooley_tukey( const double* arr, const int N, const int radix, const int offset, const int s, const int out_offset, double PI,
                           /*output:*/double** X 
                           );

int main()
{
  int i;

  double PI = getPI();
  
  double ** X = malloc( N * sizeof( double* ));

  for (i = 0; i < N; i++)
    {
      X[ i ] = malloc( sizeof( double* ));
    }
  
  int radix = (int)(round( log( (float)(N) ) / log( 2.0 ) ));

  /* --- Sanity check --- */

  dftreal_cooley_tukey( x_rand16real, N, radix, 0, 1, 0, PI, X );
  
  int ok_all = 1;
  for (i = 0; i < N; i++)
    {
      double*       result_i   = X[ i ];
      const double* expected_i = X_rand16real[ i ];
      double  delta_0 = fabs( result_i[ 0 ] - expected_i[ 0 ] );
      double  delta_1 = fabs( result_i[ 1 ] - expected_i[ 1 ] );
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
    dftreal_cooley_tukey( x_rand16real, N, radix, 0, 1, 0, PI, X );
  

  /* --- Cleanup --- */
  for (i = N; i--;)
    {
      free( X[ i ] );
    }
  
  free( X );

  /* printf("\nDone.\n"); */
  return 0;
}

void dftreal_cooley_tukey( const double* arr, const int N, const int radix, const int offset, const int s, const int out_offset, double PI, 
                           /*output:*/double** X 
                           )
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
      double t = arr[ offset ];
      double u = arr[ offset + s ];
      X[ out_offset     ][ 0 ] = t + u;
      X[ out_offset + 1 ][ 0 ] = t - u;
    }
  else
    {
      int radix_m_1 = radix - 1;
      int halfN     = N >> 1;
      int s2        = s << 1;

      /* left */
      dftreal_cooley_tukey( arr, halfN, radix_m_1, offset,      s2, out_offset,      PI, X );

      /* right */
      dftreal_cooley_tukey( arr, halfN, radix_m_1, offset + s2, s2, out_offset + s2, PI, X );
      int k;
      for (k = 0; k < halfN; k++)
        {
          double * ct = X[ offset      + k ];
          double t_re = ct[ 0 ];
          double t_im = ct[ 1 ];

          double * cu = X[ offset + s2 + k ];
          double u_re = cu[ 0 ];
          double u_im = cu[ 1 ];

          double angle = (2 * PI * k) / N;
          double a_re = cos( angle );
          double a_im = sin( angle );

          double v_re = u_re * a_re - u_im * a_im;
          double v_im = u_re * a_im + u_im * a_re;

          /* In-place finition of left and right */

          ct[ 0 ] = t_re + v_re;
          ct[ 1 ] = t_im + v_im;

          cu[ 0 ] = t_re - v_re;
          cu[ 1 ] = t_im - v_im;
        }
    }
}
