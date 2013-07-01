// dftreal16flat_msr_hh_c_code
void dftreal16flat_msr_hh ( const double * arr, /*output:*/ double ** X )
/* code generated by flatorize_c.js */
{
  /* intermediary calculations */
  double _0 = arr[0];
  double _1 = arr[8];
  double _2 = _0 + _1;
  double _3 = _0 - _1;
  double _4 = arr[4];
  double _5 = arr[12];
  double _6 = _4 + _5;
  double _7 = _4 - _5;
  double _8 = _2 + _6;
  double _9 = _2 - _6;
  double _a = arr[2];
  double _b = arr[10];
  double _c = _a + _b;
  double _d = _a - _b;
  double _e = arr[14];
  double _f = arr[6];
  double _g = _e + _f;
  double _h = _e - _f;
  double _i = _c + _g;
  double _j = _c - _g;
  double _k = _8 + _i;
  double _l = 0.7071067811865476 * (_d + _h);
  double _m = 0.7071067811865476 * (- _d + _h);
  double _n = _3 + _l;
  double _o = _3 - _l;
  double _p = _7 + _m;
  double _q = arr[1];
  double _r = arr[9];
  double _s = _q + _r;
  double _t = _q - _r;
  double _u = arr[5];
  double _v = arr[13];
  double _w = _u + _v;
  double _x = _u - _v;
  double _y = _s + _w;
  double _z = _s - _w;
  double _10 = arr[15];
  double _11 = arr[7];
  double _12 = _10 + _11;
  double _13 = _10 - _11;
  double _14 = arr[3];
  double _15 = arr[11];
  double _16 = _14 + _15;
  double _17 = _14 - _15;
  double _18 = _12 + _16;
  double _19 = _12 - _16;
  double _1a = _y + _18;
  double _1b = - _x + _17;
  double _1c = _t + _13;
  double _1d = (0.3826834323650898 * _1b) + (0.9238795325112867 * _1c);
  double _1e = - _t + _13;
  double _1f = _x + _17;
  double _1g = (0.3826834323650898 * _1e) - (0.9238795325112867 * _1f);
  double _1h = - (0.3826834323650898 * _1f) - (0.9238795325112867 * _1e);
  double _1i = (0.3826834323650898 * _1c) - (0.9238795325112867 * _1b);
  double _1j = 0.7071067811865476 * (_z + _19);
  double _1k = 0.7071067811865476 * (- _z + _19);
  
  /* output */
  X[0][0] = _k + _1a;
  X[0][1] = 0;
  X[1][0] = _n + _1d;
  X[1][1] = - _7 + _m + _1g;
  X[2][0] = _9 + _1j;
  X[2][1] = - _j + _1k;
  X[3][0] = _o + _1i;
  X[3][1] = - (- _p + _1h);
  X[4][0] = _8 - _i;
  X[4][1] = - (_y - _18);
  X[5][0] = _o - _1i;
  X[5][1] = - (_p + _1h);
  X[6][0] = _9 - _1j;
  X[6][1] = _j + _1k;
  X[7][0] = _n - _1d;
  X[7][1] = - (- _7 + _m) + _1g;
  X[8][0] = _k - _1a;
  X[8][1] = 0;
}
