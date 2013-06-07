#include <math.h>

double getPI() { return 2.0 * (double)(acos( 1.0 )); }  /* M_PI widely used... but not standard (yet?) */

void dftreal16flat ( const double * arr, /*output:*/ double ** X )
/* code generated by flatorize_c.js */
{
  /* intermediary calculations */
  double _0 = arr[0];
  double _1 = arr[8];
  double _2 = 0;
  double _3 = _0 + _1;
  double _4 = _0 - _1;
  double _5 = 0 - _2;
  double _6 = arr[4];
  double _7 = arr[12];
  double _8 = _6 + _7;
  double _9 = _6 - _7;
  double _a = _3 + _8;
  double _b = _2 + _2;
  double _c = _3 - _8;
  double _d = _2 - _2;
  double _e = - _9;
  double _f = _4 + _5;
  double _g = _5 + _e;
  double _h = _4 - _5;
  double _i = _5 - _e;
  double _j = arr[2];
  double _k = arr[10];
  double _l = _j + _k;
  double _m = _j - _k;
  double _n = arr[6];
  double _o = arr[14];
  double _p = _n + _o;
  double _q = _n - _o;
  double _r = _l + _p;
  double _s = _l - _p;
  double _t = - _q;
  double _u = _m + _5;
  double _v = _5 + _t;
  double _w = _m - _5;
  double _x = _5 - _t;
  double _y = _a + _r;
  double _z = _b + _b;
  double _10 = _a - _r;
  double _11 = _b - _b;
  double _12 = 0.7071067811865476 * _u + 0.7071067811865475 * _v;
  double _13 = 0.7071067811865476 * _v + -0.7071067811865475 * _u;
  double _14 = _f + _12;
  double _15 = _g + _13;
  double _16 = _f - _12;
  double _17 = _g - _13;
  double _18 = - _s;
  double _19 = _c + _d;
  double _1a = _d + _18;
  double _1b = _c - _d;
  double _1c = _d - _18;
  double _1d = -0.7071067811865475 * _w + 0.7071067811865476 * _x;
  double _1e = -0.7071067811865475 * _x + -0.7071067811865476 * _w;
  double _1f = _h + _1d;
  double _1g = _i + _1e;
  double _1h = _h - _1d;
  double _1i = _i - _1e;
  double _1j = arr[1];
  double _1k = arr[9];
  double _1l = _1j + _1k;
  double _1m = _1j - _1k;
  double _1n = arr[5];
  double _1o = arr[13];
  double _1p = _1n + _1o;
  double _1q = _1n - _1o;
  double _1r = _1l + _1p;
  double _1s = _1l - _1p;
  double _1t = - _1q;
  double _1u = _1m + _5;
  double _1v = _5 + _1t;
  double _1w = _1m - _5;
  double _1x = _5 - _1t;
  double _1y = arr[3];
  double _1z = arr[11];
  double _20 = _1y + _1z;
  double _21 = _1y - _1z;
  double _22 = arr[7];
  double _23 = arr[15];
  double _24 = _22 + _23;
  double _25 = _22 - _23;
  double _26 = _20 + _24;
  double _27 = _20 - _24;
  double _28 = - _25;
  double _29 = _21 + _5;
  double _2a = _5 + _28;
  double _2b = _21 - _5;
  double _2c = _5 - _28;
  double _2d = _1r + _26;
  double _2e = _1r - _26;
  double _2f = 0.7071067811865476 * _29 + 0.7071067811865475 * _2a;
  double _2g = 0.7071067811865476 * _2a + -0.7071067811865475 * _29;
  double _2h = _1u + _2f;
  double _2i = _1v + _2g;
  double _2j = _1u - _2f;
  double _2k = _1v - _2g;
  double _2l = - _27;
  double _2m = _1s + _d;
  double _2n = _d + _2l;
  double _2o = _1s - _d;
  double _2p = _d - _2l;
  double _2q = -0.7071067811865475 * _2b + 0.7071067811865476 * _2c;
  double _2r = -0.7071067811865475 * _2c + -0.7071067811865476 * _2b;
  double _2s = _1w + _2q;
  double _2t = _1x + _2r;
  double _2u = _1w - _2q;
  double _2v = _1x - _2r;
  double _2w = 0.9238795325112867 * _2h + 0.3826834323650898 * _2i;
  double _2x = 0.9238795325112867 * _2i + -0.3826834323650898 * _2h;
  double _2y = 0.7071067811865476 * _2m + 0.7071067811865475 * _2n;
  double _2z = 0.7071067811865476 * _2n + -0.7071067811865475 * _2m;
  double _30 = 0.38268343236508984 * _2s + 0.9238795325112867 * _2t;
  double _31 = 0.38268343236508984 * _2t + -0.9238795325112867 * _2s;
  double _32 = - _2e;
  double _33 = -0.3826834323650897 * _2j + 0.9238795325112867 * _2k;
  double _34 = -0.3826834323650897 * _2k + -0.9238795325112867 * _2j;
  double _35 = -0.7071067811865475 * _2o + 0.7071067811865476 * _2p;
  double _36 = -0.7071067811865475 * _2p + -0.7071067811865476 * _2o;
  double _37 = -0.9238795325112867 * _2u + 0.3826834323650899 * _2v;
  double _38 = -0.9238795325112867 * _2v + -0.3826834323650899 * _2u;
  
  /* output */
  X[0][0] = _y + _2d;
  X[0][1] = _z + _z;
  X[1][0] = _14 + _2w;
  X[1][1] = _15 + _2x;
  X[2][0] = _19 + _2y;
  X[2][1] = _1a + _2z;
  X[3][0] = _1f + _30;
  X[3][1] = _1g + _31;
  X[4][0] = _10 + _11;
  X[4][1] = _11 + _32;
  X[5][0] = _16 + _33;
  X[5][1] = _17 + _34;
  X[6][0] = _1b + _35;
  X[6][1] = _1c + _36;
  X[7][0] = _1h + _37;
  X[7][1] = _1i + _38;
  X[8][0] = _y - _2d;
  X[8][1] = _z - _z;
  X[9][0] = _14 - _2w;
  X[9][1] = _15 - _2x;
  X[10][0] = _19 - _2y;
  X[10][1] = _1a - _2z;
  X[11][0] = _1f - _30;
  X[11][1] = _1g - _31;
  X[12][0] = _10 - _11;
  X[12][1] = _11 - _32;
  X[13][0] = _16 - _33;
  X[13][1] = _17 - _34;
  X[14][0] = _1b - _35;
  X[14][1] = _1c - _36;
  X[15][0] = _1h - _37;
  X[15][1] = _1i - _38;
}