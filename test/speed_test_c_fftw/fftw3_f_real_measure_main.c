#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <fftw3.h>  /* sudo apt-get install fftw3 -> not enough, go to www.fftw.org */

#include "fftw3real_common.h"

extern const int     epsilon;
extern const float* get_x_randreal_f( const int dftsize );
extern const float* get_X_randreal_f( const int dftsize );

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

  
  float * x_in = (float *) malloc( N * sizeof( float ) );
  const int N_out = (N >> 1) + 1;
  fftwf_complex * X    = (fftwf_complex*) fftwf_malloc( N_out * sizeof( fftwf_complex ));

  const float* x_randreal = get_x_randreal_f( N );
  const float* X_randreal = get_X_randreal_f( N );

  if (!x_randreal  ||  !X_randreal)
    {
      fprintf( stderr, "\nERROR: unrecognized dftsize %d (could not get both x_randreal and X_randreal)\n", N );
      return -1;
    }

  /* Prepare FFTW plan*/

  PLAN_DURATION_BEGIN( concise );
 
  fftwf_plan p = fftwf_plan_dft_r2c_1d(N, x_in, X, FFTW_MEASURE);

  PLAN_DURATION_END( concise );

  /* Prepare input (need to copy because `x_randreal` has `const`) */
  for (i = 0; i < N; i++)
      x_in[ i ] = x_randreal[ i ];
  
  /* --- Sanity check --- */

  fftwf_execute( p );
  
  int ok_all = 1;
  for (i = 0; i < N_out; i++)
    {
      const float* result_i   = X[ i ];
      const float* expected_i = X_randreal + (i << 1);

      float  delta_0 = fabs( result_i[ 0 ] - expected_i[ 0 ] );
      float  delta_1 = fabs( result_i[ 1 ] - expected_i[ 1 ] );

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
    fftwf_execute( p );

  TEST_DURATION_END( concise );
  
  /* --- Cleanup --- */
  free( x_in );
  fftwf_destroy_plan( p );
  fftwf_free( X );
  
  /* printf("\nDone.\n"); */
  return 0;
}
