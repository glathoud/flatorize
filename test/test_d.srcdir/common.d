import std.math, core.memory;
import common_decl;

const(double*)  get_x_randreal( const int dftsize )
{
  if (dftsize <= 1024)
    return cast(const (double*))(x_randreal_1024);
  
  return null;
}

struct X_TRUTH {
  int      dftsize;
  const(double*)  X;
  X_TRUTH* next;
};

X_TRUTH _X_TRUTH_cache = { -1, null, null };

const(double*) get_X_randreal( const int dftsize )
{
  if (dftsize == 1024)
    return cast(const double*)(X_randreal_1024);

  if (dftsize < 1024)
    {
      /* try to find it in the cache*/
      
      X_TRUTH * one = &_X_TRUTH_cache;
      while (one.dftsize != dftsize  &&  one.next)
        one = one.next;

      if (one.dftsize == dftsize)
        return one.X;  /* found */

      /* not found -> create it and append it to the cache */
      
      double * X = cast(double*)(GC.calloc( dftsize * 2 * double.sizeof ));

      X_TRUTH * new_one = new X_TRUTH( dftsize, X, null );

      one.next = new_one;

      /* compute the actual `X[k]` values */

      dftreal_loopy( dftsize, cast(const(double*))x_randreal_1024, X );

      return X;
    }
  
  return null; 
}


void dftreal_loopy( const int dftsize, const double * xreal_in, double* X_out )
{
  int k, n;
  double TWO_PI = 2 * PI;
  double * one_out = X_out;
  double toto = 0;
  double sum_r, sum_i;
  
  
  for ({k = 0;
      double ratio = -(TWO_PI * k) / dftsize;
    } k < dftsize; k++)
    {
      sum_r = 0.0;
      sum_i = 0.0;

      for ({ n = 0; double x_n; double angle; } n < dftsize; n++)
        {
          x_n   = xreal_in[ n ];
          angle = ratio * n;

          sum_r += x_n * cos( angle );
          sum_i += x_n * sin( angle );
        }

      (*one_out) = sum_r;
      one_out++;
      (*one_out) = sum_i;
      one_out++;
    }
  
}
