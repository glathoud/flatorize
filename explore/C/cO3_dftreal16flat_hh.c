#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include "cO3_dftreal16_common.h"

extern const int   NITER;
extern const int   N;
extern const int   epsilon;
extern const double x_randreal[];
extern const double X_randreal[][2];

extern void dftreal16flat_hh ( const double * arr, /*output:*/ double ** X );

int main()
{
  int i;

  const Nhh = 1 + (N >> 1);
  double ** X;

  ALIGNED_MALLOC_CPLX_ARRAY( X, N );  

  /* --- Sanity check --- */

  dftreal16flat_hh( x_randreal, X );
  
  int ok_all = 1;
  for (i = 0; i < Nhh; i++)
    {
      double*       result_i   = X[ i ];
      const double* expected_i = X_randreal[ i ];
      double  delta_0 = fabs( result_i[ 0 ] - expected_i[ 0 ] );
      double  delta_1 = fabs( result_i[ 1 ] - expected_i[ 1 ] );
      int ok = EPSILON > delta_0  &&  EPSILON > delta_1;
      if (!ok)
        printf( "%d: %g %g, %g %g, %g %g -> ok: %d\n", i, result_i[ 0 ], result_i[ 1 ], expected_i[ 0 ], expected_i[ 1 ], delta_0, delta_1, ok );
      ok_all &= ok;
    }
  /* printf("ok_all: %d\n", ok_all); */
  if (!ok_all)
    {
      fprintf( stderr, "\nERROR: buggy implementation!\n");
      return -1;
    }
  
  /* --- Performance test --- */

  TEST_DURATION_BEGIN

  for (i = NITER ; i-- ; )
    dftreal16flat_hh( x_randreal, X );
  
  TEST_DURATION_END

  /* --- Cleanup --- */

  ALIGNED_FREE_CPLX_ARRAY( X, N );

  /* printf("\nDone.\n"); */
  return 0;
}
