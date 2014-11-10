#include <math.h>
#include <stdio.h>
#include "c_matmul_common.c"

extern const int NITER;
extern const int I;
extern const int J;
extern const int K;
extern const float mat_a[];
extern const float mat_b[];
extern const float mat_c[];

void matmul_classic( const float* a, const float* b, const int I, const int J, const int K, float* out );

int main()
{
  const int IK = I*K; // 3*2
  float result[3*2] = { 0, 0, 
                        0, 0, 
                        0, 0 };
  int i;

  /* --- Sanity check --- */

  matmul_classic( mat_a, mat_b, I, J, K, result );
  
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
    matmul_classic( mat_a, mat_b, I, J, K, result );

  /* printf("\nDone.\n"); */
  return 0;
}

void matmul_classic( const float* a, const float* b, const int I, const int J, const int K, float* out )
{
  int   a_offset = 0;
  int out_offset = 0;
  int i,j,k;

  for (i = 0; i < I; i++ , a_offset += J , out_offset += K) 
    {
      for (k = 0; k < K; k++)
        {
          int   b_offset = k;
          float sum      = 0;
          for (j = 0; j < J; j++ , b_offset += K)
            {
              sum += a[ a_offset + j ] * b[ b_offset ];
            }
          
          out[ out_offset + k ] = sum;
        }
    }
}
