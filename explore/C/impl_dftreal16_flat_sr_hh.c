// dftreal16flat_sr_hh_c_code
void dftreal16flat_sr_hh ( const double * arr, /*output:*/ double ** X )
/* code generated by flatorize_c.js */
{
  const double DOUBLE_0_7071067811865476 = 0.7071067811865476;
  const double DOUBLE_0_3826834323650898 = 0.3826834323650898;
  const double DOUBLE_0_9238795325112867 = 0.9238795325112867;
  const double DOUBLE_0 = 0;
  
  double*__outptr__ = X[0];
  __outptr__[1] = DOUBLE_0;
  __outptr__[17] = DOUBLE_0;
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
  __outptr__[8] = _8 - _i;
  double _k = _8 + _i;
  double _l = DOUBLE_0_7071067811865476 * (_d + _h);
  double _m = DOUBLE_0_7071067811865476 * (- _d + _h);
  double _n = _3 + _l;
  double _p = _3 - _l;
  double _o = - _7 + _m;
  double _q = _7 + _m;
  double _r = arr[1];
  double _s = arr[9];
  double _t = _r + _s;
  double _u = _r - _s;
  double _v = arr[5];
  double _w = arr[13];
  double _x = _v + _w;
  double _y = _v - _w;
  double _z = _t + _x;
  double _10 = _t - _x;
  double _11 = arr[15];
  double _12 = arr[7];
  double _13 = _11 + _12;
  double _14 = _11 - _12;
  double _15 = arr[3];
  double _16 = arr[11];
  double _17 = _15 + _16;
  double _18 = _15 - _16;
  double _19 = _13 + _17;
  double _1a = _13 - _17;
  double _1b = _z + _19;
  __outptr__[9] = - (_z - _19);
  __outptr__[0] = _k + _1b;
  __outptr__[16] = _k - _1b;
  double _1c = - (DOUBLE_0_3826834323650898 * _y) + (DOUBLE_0_9238795325112867 * _u);
  double _1d = - (DOUBLE_0_3826834323650898 * _u) - (DOUBLE_0_9238795325112867 * _y);
  double _1e = (DOUBLE_0_3826834323650898 * _18) + (DOUBLE_0_9238795325112867 * _14);
  double _1f = (DOUBLE_0_3826834323650898 * _14) - (DOUBLE_0_9238795325112867 * _18);
  double _1g = _1c + _1e;
  double _1i = _1c - _1e;
  __outptr__[2] = _n + _1g;
  __outptr__[14] = _n - _1g;
  double _1h = _1d + _1f;
  double _1j = _1d - _1f;
  __outptr__[3] = _o + _1h;
  __outptr__[15] = - (_o - _1h);
  __outptr__[6] = _p - _1j;
  __outptr__[10] = _p + _1j;
  __outptr__[7] = - (- _q + _1i);
  __outptr__[11] = - (_q + _1i);
  double _1k = DOUBLE_0_7071067811865476 * (_10 + _1a);
  double _1l = DOUBLE_0_7071067811865476 * (- _10 + _1a);
  __outptr__[4] = _9 + _1k;
  __outptr__[12] = _9 - _1k;
  __outptr__[5] = - _j + _1l;
  __outptr__[13] = _j + _1l;
}
