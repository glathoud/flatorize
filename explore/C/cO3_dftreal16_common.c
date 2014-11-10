#include <math.h>
#include <time.h>
#include "cO3_dftreal16_common.h"

double getPI() { return 2.0 * (double)(acos( 1.0 )); }  /* M_PI widely used... but not standard (yet?) */

#include "impl_dftreal16_flat.c"
#include "impl_dftreal16_flat_hh.c"
#include "impl_dftreal16_flat_sr_hh.c"
#include "impl_dftreal16_flat_msr_hh.c"
