#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <fftw3.h>

extern const int   NITER;
extern const int   N;
extern const int   epsilon;
extern const double x_randreal[];
extern const double X_randreal[][2];

int main( int argc, char ** argv )
{
  int i;

  int niter = NITER;
  int concise = 0;

  if (argc > 1)  
  {
    float tmp;
    sscanf( argv[ 1 ], "%g", &tmp );  /* Permit 1.234e5 notation */
    niter = (int)(tmp);
    concise = 1;
  }



  double * x_in = (double *) malloc( N * sizeof( double ) );
  const int N_out = (N >> 1) + 1;
  fftw_complex * X    = (fftw_complex*) fftw_malloc( N_out * sizeof( fftw_complex ));


  /* Prepare FFTW plan*/

  PLAN_DURATION_BEGIN( concise );
 
  fftw_plan p = fftw_plan_dft_r2c_1d(N, x_in, X, FFTW_MEASURE);

  PLAN_DURATION_END( concise );

  /* Prepare input (need to copy because `x_randreal` has `const`) */
  for (i = 0; i < N; i++)
      x_in[ i ] = x_randreal[ i ];
  
  /* --- Sanity check --- */

  fftw_execute( p );
  
  int ok_all = 1;
  for (i = 0; i < N_out; i++)
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

  TEST_DURATION_BEGIN( concise );

  for (i = niter ; i-- ; )
    fftw_execute( p );

  TEST_DURATION_END( concise );
  
  /* --- Cleanup --- */
  free( x_in );
  fftw_destroy_plan( p );
  fftw_free( X );
  
  /* printf("\nDone.\n"); */
  return 0;
}
