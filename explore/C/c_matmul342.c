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

void matmul342( const float* a, const float* b, const int I, const int J, const int K, float* out );

int main()
{
  const int IK = I*K; // 3*2
  float result[3*2] = { 0, 0, 
                        0, 0, 
                        0, 0 };
  int i;

  /* --- Sanity check --- */

  matmul342( mat_a, mat_b, I, J, K, result );
  
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
    matmul342( mat_a, mat_b, I, J, K, result );

  /* printf("\nDone.\n"); */
  return 0;
}

void matmul342( const float* a, const float* b, const int I, const int J, const int K, float* out )
{
  float _0 = a[0];
  float _1 = b[0];
  float _2 = a[1];
  float _3 = b[2];
  float _4 = a[2];
  float _5 = b[4];
  float _6 = a[3];
  float _7 = b[6];
  float _8 = b[1];
  float _9 = b[3];
  float _a = b[5];
  float _b = b[7];
  float _c = a[4];
  float _d = a[5];
  float _e = a[6];
  float _f = a[7];
  float _g = a[8];
  float _h = a[9];
  float _i = a[10];
  float _j = a[11];

  out[0] = _0 * _1 + _2 * _3 + _4 * _5 + _6 * _7;
  out[1] = _0 * _8 + _2 * _9 + _4 * _a + _6 * _b;
  out[2] = _c * _1 + _d * _3 + _e * _5 + _f * _7;
  out[3] = _c * _8 + _d * _9 + _e * _a + _f * _b;
  out[4] = _g * _1 + _h * _3 + _i * _5 + _j * _7;
  out[5] = _g * _8 + _h * _9 + _i * _a + _j * _b;
}
