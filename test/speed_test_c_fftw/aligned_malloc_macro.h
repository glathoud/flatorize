#ifndef ALIGNED_MALLOC_CPLX_ARRAY
#define ALIGNED_MALLOC_CPLX_ARRAY( X, N ) \
X = malloc( N * sizeof( double* )); \
X[0] = malloc( N * 2 * sizeof( double )); \
{ \
  int i; \
  double* tmp = X[0]; \
  for (i = 0; i < N; i++) \
    { \
      X[ i ] = tmp; \
      tmp += 2; \
    } \
}
#endif


#ifndef ALIGNED_FREE_CPLX_ARRAY
#define ALIGNED_FREE_CPLX_ARRAY( X, N ) \
free( X[0] ); \
free( X );
#endif
