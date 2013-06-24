#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include "cO3_dftreal16_common.h"

extern const int   NITER;
extern const int   N;
extern const int   epsilon;
extern const double x_randreal[];
extern const double X_randreal[][2];

extern void dftreal16flat_sr_hh ( const double * arr, /*output:*/ double ** X );

int main()
{
  int i;

  const Nhh = 1 + (N >> 1);

  double ** X = malloc( N * sizeof( double* ));

  for (i = 0; i < N; i++)
    {
      X[ i ] = malloc( 2 * sizeof( double ));
    }
  

  /* --- Sanity check --- */

  dftreal16flat_sr_hh( x_randreal, X );
  
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
  for (i = NITER ; i-- ; )
    dftreal16flat_sr_hh( x_randreal, X );
  

  /* --- Cleanup --- */
  for (i = N; i--;)
    {
      free( X[ i ] );
    }
  
  free( X );

  /* printf("\nDone.\n"); */
  return 0;
}
