#include <math.h>

static const int NITER = 1e7;

static const int N = 16;

static const double EPSILON = 1e-6;

double getPI();

static const double x_randreal[] = {
  0.1282171221003854, 0.8555626892325477, 0.4868615930581733, 0.8822334446999264, 0.1642991454638509, 0.3847938531198832, 0.4752562049024062, 0.2817585792827756, 0.7606114518559085, 0.3672050576375234, 0.9347732018208755, 0.333249977215507, 0.4230856585271232, 0.2373079745840775, 0.09055989437351712, 0.6619542552902331
};

static const double X_randreal[][2] = { 
  {  7.467730103164715    ,  0                   },
  { -0.26505193634215274  , -0.38135908310604616 },
  {  0.5340078893984478   , -1.4727244655100122  },
  { -0.08220606779170192  , -0.0474878840990717  },
  { -0.5112375162077041   , +0.31432668191441016 },
  { -0.005097180117932504 , +0.3806852099157544  },
  {  0.0688796505321918   , +0.2389129256962388  },
  { -2.177222134770305    , -0.9883320413443093  },
  { -0.5404015589602342   ,  0                   },
  { -2.1772221347703056   , +0.9883320413443092  },
  {  0.06887965053219172  , -0.2389129256962388  },
  { -0.005097180117932594 , -0.3806852099157543  },
  { -0.5112375162077041   , -0.31432668191441016 },
  { -0.08220606779170178  , +0.04748788409907165 },
  {  0.5340078893984477   , +1.4727244655100122  },
  { -0.26505193634215285  , +0.3813590831060461  }
};

void dftreal16flat ( const double * arr, /*output:*/ double ** X );

void dftreal16flat_hh ( const double * arr, /*output:*/ double ** X );
