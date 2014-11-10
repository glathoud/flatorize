#include <math.h>
#include <time.h>
#include "cO3_dftreal1024_common.h"


double getPI() { return 2.0 * (double)(acos( 1.0 )); }  /* M_PI widely used... but not standard (yet?) */

#include "impl_dftreal1024_flat_hh.c"
#include "impl_dftreal1024_flat_sr_hh.c"
#include "impl_dftreal1024_flat_msr_hh.c"
