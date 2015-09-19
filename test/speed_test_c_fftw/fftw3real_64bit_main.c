#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <fftw3.h>  /* sudo apt-get install fftw3 -> not enough, go to www.fftw.org */

#include "fftw3real_common.h"

extern const int     epsilon;
extern const double* get_x_randreal_64bit( const int dftsize );
extern const double* get_X_randreal_64bit( const int dftsize );

int main( int argc, char ** argv )
{
  if (argc < 3)
    {
      fprintf( stderr, "\nUsage parameters: <N> <NITER> (e.g. 1024 1e5)\n");
      return -1;
    }
  
  int i;

  float tmp;
  int N, NITER;
  int concise = 1;
  
  sscanf( argv[ 1 ], "%g", &tmp );  /* Permit 1.234e5 notation */
  N = (int)(tmp);

  sscanf( argv[ 2 ], "%g", &tmp );  /* Permit 1.234e5 notation */
  NITER = (int)(tmp);


  double * x_in = (double *) malloc( N * sizeof( double ) );
  const int N_out = (N >> 1) + 1;
  fftw_complex * X    = (fftw_complex*) fftw_malloc( N_out * sizeof( fftw_complex ));

  const double* x_randreal = get_x_randreal_64bit( N );
  const double* X_randreal = get_X_randreal_64bit( N );

  if (!x_randreal  ||  !X_randreal)
    {
      fprintf( stderr, "\nERROR: unrecognized dftsize %d (could not get both x_randreal and X_randreal)\n", N );
      return -1;
    }


  /* Prepare input (need to copy because `x_randreal` has `const`) */

  for (i = 0; i < N; i++)
    {
      x_in[ i ] = x_randreal[ i ];
    }


  /* Prepare FFTW plan*/

  PLAN_DURATION_BEGIN( concise );

  fftw_plan p = fftw_plan_dft_r2c_1d(N, x_in, X, FFTW_ESTIMATE);

  PLAN_DURATION_END( concise );
  
  /* --- Sanity check --- */

  fftw_execute( p );

  int ok_all = 1;
  for (i = 0; i < N_out; i++)
    {
      const double* result_i   = X[ i ];
      const double* expected_i = X_randreal + (i << 1);

      double  delta_0 = fabs( result_i[ 0 ] - expected_i[ 0 ] );
      double  delta_1 = fabs( result_i[ 1 ] - expected_i[ 1 ] );

      int ok = EPSILON > delta_0  &&  EPSILON > delta_1;

      ok_all &= ok;
    }

  if (!ok_all)
    {
      fprintf( stderr, "\nERROR: buggy implementation!\n");
      return -1;
    }
  
  /* --- Performance test --- */

  TEST_DURATION_BEGIN( concise );

  for (i = NITER ; i-- ; )
    fftw_execute( p );

  TEST_DURATION_END( concise );
  
  /* --- Cleanup --- */
  free( x_in );
  fftw_destroy_plan( p );
  fftw_free( X );
  
  /* printf("\nDone.\n"); */
  return 0;
}
