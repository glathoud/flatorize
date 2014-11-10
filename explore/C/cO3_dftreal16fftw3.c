#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <fftw3.h>
#include "cO3_dftreal16_common.h"

extern const int   NITER;
extern const int   N;
extern const int   epsilon;
extern const double x_randreal[];
extern const double X_randreal[][2];

int main()
{
  int i;

  /* Prepare input */
  fftw_complex * x_in = (fftw_complex*) fftw_malloc( N * sizeof( fftw_complex ));
  
  for (i = 0; i < N; i++)
    {
      x_in[ i ][ 0 ] = x_randreal[ i ];
      x_in[ i ][ 1 ] = 0;
    }
  
  /* Prepare output */
  fftw_complex * X    = (fftw_complex*) fftw_malloc( N * sizeof( fftw_complex ));
  
  /* Prepare FFTW plan*/
  fftw_plan p = fftw_plan_dft_1d(N, x_in, X, FFTW_FORWARD, FFTW_ESTIMATE);
  
  /* --- Sanity check --- */

  fftw_execute( p );
  
  int ok_all = 1;
  for (i = 0; i < N; i++)
    {
      const double* result_i = X[ i ];
      const double* expected_i = X_randreal[ i ];
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

  TEST_DURATION_BEGIN;

  for (i = NITER ; i-- ; )
    fftw_execute( p );

  TEST_DURATION_END;
  
  /* --- Cleanup --- */
  fftw_destroy_plan( p );
  fftw_free( x_in );  
  fftw_free( X );
  
  /* printf("\nDone.\n"); */
  return 0;
}
