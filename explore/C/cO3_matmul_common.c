#include "cO3_matmul_common.h"

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


// matmul342_c_code
void matmul342 ( const float * a, const float * b, /*output:*/ float * c )
/* code generated by flatorize_c.js */
{
  float _0 = a[0];
  float _1 = b[0];
  float _2 = a[1];
  float _3 = b[2];
  float _4 = a[2];
  float _5 = b[4];
  float _6 = a[3];
  float _7 = b[6];
  c[0] = (_6 * _7) + (_4 * _5) + (_2 * _3) + (_0 * _1);
  float _8 = b[1];
  float _9 = b[3];
  float _a = b[5];
  float _b = b[7];
  c[1] = (_6 * _b) + (_4 * _a) + (_2 * _9) + (_0 * _8);
  float _c = a[4];
  float _d = a[5];
  float _e = a[6];
  float _f = a[7];
  c[2] = (_f * _7) + (_e * _5) + (_d * _3) + (_c * _1);
  c[3] = (_f * _b) + (_e * _a) + (_d * _9) + (_c * _8);
  float _g = a[8];
  float _h = a[9];
  float _i = a[10];
  float _j = a[11];
  c[4] = (_j * _7) + (_i * _5) + (_h * _3) + (_g * _1);
  c[5] = (_j * _b) + (_i * _a) + (_h * _9) + (_g * _8);
}
