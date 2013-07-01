// dftreal16flat_msr_hh_c_code
void dftreal16flat_msr_hh ( const double * arr, /*output:*/ double ** X )
/* code generated by flatorize_c.js */
{
  /* intermediary calculations */
  X[0][1] = 0;
  X[8][1] = 0;
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
  X[4][0] = _8 - _i;
  double _j = _c - _g;
  double _k = _8 + _i;
  double _l = 0.7071067811865476 * (_d + _h);
  double _m = 0.7071067811865476 * (- _d + _h);
  double _n = _3 + _l;
  double _o = - _7 + _m;
  double _p = _3 - _l;
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
  X[0][0] = _k + _1b;
  X[4][1] = - (_z - _19);
  X[8][0] = _k - _1b;
  double _1c = _u - (0.4142135623730951 * _y);
  double _1d = _14 + (0.4142135623730951 * _18);
  double _1e = 0.9238795325112867 * (_1c + _1d);
  X[1][0] = _n + _1e;
  X[7][0] = _n - _1e;
  double _1f = _y + (0.4142135623730951 * _u);
  double _1g = - _18 + (0.4142135623730951 * _14);
  double _1h = 0.9238795325112867 * (- _1f + _1g);
  X[1][1] = _o + _1h;
  double _1i = 0.9238795325112867 * (_1c - _1d);
  double _1j = -0.9238795325112867 * (_1f + _1g);
  X[3][0] = _p - _1j;
  X[3][1] = - (- _q + _1i);
  X[5][0] = _p + _1j;
  X[5][1] = - (_q + _1i);
  X[7][1] = - (_o - _1h);
  double _1k = 0.7071067811865476 * (_10 + _1a);
  X[2][0] = _9 + _1k;
  X[6][0] = _9 - _1k;
  double _1l = 0.7071067811865476 * (- _10 + _1a);
  
  /* output */
  X[2][1] = - _j + _1l;
  X[6][1] = _j + _1l;
}
