#include <math.h>
#include <stdio.h>
#include "cO3_matmul_common.h"

extern const int NITER;
extern const int I;
extern const int J;
extern const int K;
extern const float mat_a[];
extern const float mat_b[];
extern const float mat_c[];

extern void matmul342( const float* a, const float* b, float* out );

int main()
{
  const int IK = I*K; // 3*2
  float result[3*2] = { 0, 0, 
                        0, 0, 
                        0, 0 };
  int i;

  /* --- Sanity check --- */

  matmul342( mat_a, mat_b, result );
  
  int ok_all = 1;
  for (i = 0; i < IK; i++)
    {
      float x = result[ i ];
      int ok = 1e-10 > fabs( x - mat_c[ i ] );
      /* printf( "%d: %f %f %f -> ok: %d\n", i, x, mat_c[ i ], fabs( x - mat_c[ i ] ), ok); */
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
    matmul342( mat_a, mat_b, result );

  /* printf("\nDone.\n"); */
  return 0;
}
