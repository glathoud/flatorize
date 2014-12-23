#include <math.h>
#include <stdlib.h>

#include "fftw3real_common.h"

const double*  get_x_randreal( const int dftsize )
{
  if (dftsize <= 1024)
    return (const double*)(x_randreal_1024);
  
  return NULL;
}

typedef struct X_TRUTH {
  int             dftsize;
  double*         X;
  struct X_TRUTH* next;
} X_TRUTH;

X_TRUTH _X_TRUTH_cache = { 1024, (double*)(X_randreal_1024), NULL };

const double* get_X_randreal( const int dftsize )
{
  if (dftsize == 1024)
    return (const double*)(X_randreal_1024);

  if (dftsize < 1024)
    {
      /* try to find it in the cache*/
      
      X_TRUTH * one = &_X_TRUTH_cache;
      while (one->dftsize != dftsize  &&  one->next)
        one = one->next;

      if (one->dftsize == dftsize)
        return one->X;  /* found */

      /* not found -> create it and append it to the cache */
      
      double * X = (double*)(malloc( dftsize * 2 * sizeof( double ) ));

      X_TRUTH * new_one = (X_TRUTH*)(malloc( sizeof( X_TRUTH ) ));

      one->next = new_one;

      new_one->dftsize = dftsize;
      new_one->X       = X;
      new_one->next    = NULL;

      /* compute the actual `X[k]` values */

      dftreal_loopy( dftsize, x_randreal_1024, X );

      return X;
    }
  
  return NULL; 
}


void dftreal_loopy( const int dftsize, const double * xreal_in, double* X_out )
{
  int k, n;
  double TWO_PI = 2 * getPI();
  double * one_out = X_out;
  
  for (k = 0; k < dftsize; k++)
    {
      double ratio = -(TWO_PI * k) / dftsize;

      double real = 0;
      double imag = 0;

      for (n = 0; n < dftsize; n++)
        {
          double x_n   = xreal_in[ n ];
          double angle = ratio * n;

          real += x_n * cos( angle );
          imag += x_n * sin( angle );
        }

      (*one_out) = real;
      one_out++;
      (*one_out) = imag;
      one_out++;
    }
  
}


double getPI()
{
  return 2 * acos( 0 );
}
