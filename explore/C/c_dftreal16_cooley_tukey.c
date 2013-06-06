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

  printf("radix: %d\n", radix);

  /* --- Sanity check --- */

  dftreal_cooley_tukey( x_rand16real, N, 0, radix, 1, 0, PI, X );
  
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
    dftreal_cooley_tukey( x_rand16real, N, 0, radix, 1, 0, PI, X );
  

  /* --- Cleanup --- */
  for (i = N; i--;)
    {
      free( X[ i ] );
    }
  
  free( X );

  /* printf("\nDone.\n"); */
  return 0;
}

void dftreal_cooley_tukey( const double* arr, const int N, const int offset, const int radix, const int s, const int out_offset, double PI, 
                           /*output:*/double** X 
                           )
/*
// *Implement* the Discrete Fourier Transform (DFT)
// for a 2-radix (N == 1 << radix)
// using a recursive Cooley-Tukey implementation.
//
// Based on:
// http://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm#Pseudocode
//
// xxx
// Actually in-place issues more complicated than I thought
// http://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm#Data_reordering.2C_bit_reversal.2C_and_in-place_algorithms
// 
// So we have to go first for a (possibly simpler) out-of-place implementation.
*/
{
  printf( "dftreal_cooley_tukey N:%d, offset:%d, radix:%d, s:%d, out_offset:%d, PI:%f\n", N, offset, radix, s, out_offset, PI );

  if (radix < 1)
    {
      X[ out_offset ][ 0 ] = arr[ offset ];
      X[ out_offset ][ 1 ] = 0;
    }
  else if (radix < 2)
    {
      double * ct = X[ offset ];
      double t_re = ct[ 0 ];
      double t_im = ct[ 1 ];

      double * cu = X[ offset + s ];
      double u_re = cu[ 0 ];
      double u_im = cu[ 1 ];

      X[ out_offset     ][ 0 ] = t_re + u_re;
      X[ out_offset     ][ 0 ] = t_im + u_im;

      X[ out_offset + 1 ][ 0 ] = t_re - u_re;
      X[ out_offset + 1 ][ 1 ] = t_im - u_im;
    }
  else
    {
      int radix_m_1 = radix - 1;
      int halfN     = N >> 1;
      int s2        = s << 1;

      /* left */
      dftreal_cooley_tukey( arr, halfN, offset,     radix_m_1, s2, out_offset,         PI, X );

      /* right */
      dftreal_cooley_tukey( arr, halfN, offset + s, radix_m_1, s2, out_offset + s, PI, X );
      int k;
      for (k = 0; k < halfN; k++)
        {
          double * ct = X[ offset      + k ];
          double t_re = ct[ 0 ];
          double t_im = ct[ 1 ];

          double * cu = X[ offset + s  + k ];
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
