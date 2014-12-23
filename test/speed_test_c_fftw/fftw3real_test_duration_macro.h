#include <time.h>

#ifndef DURATION_BEGIN
#define DURATION_BEGIN( name, begin, end, duration, concise )   \
struct timespec begin, end; \
double duration; \
clock_gettime(CLOCK_PROCESS_CPUTIME_ID, &begin);
#endif

#ifndef DURATION_END
#define DURATION_END( name, begin, end, duration, concise )     \
clock_gettime(CLOCK_PROCESS_CPUTIME_ID, &end); \
 duration = (double)(end.tv_sec - begin.tv_sec) + 1e-9 * (double)(end.tv_nsec - begin.tv_nsec); if (concise) printf("%g\n", duration); else printf(name " duration: %g seconds (" __FILE__  ")\n", duration);
#endif


#ifndef PLAN_DURATION_BEGIN
#define PLAN_DURATION_BEGIN( concise )   DURATION_BEGIN( "plan", plan_begin, plan_end, plan_duration, concise )
#endif

#ifndef PLAN_DURATION_END
#define PLAN_DURATION_END( concise )     DURATION_END( "plan", plan_begin, plan_end, plan_duration, concise )
#endif




#ifndef TEST_DURATION_BEGIN
#define TEST_DURATION_BEGIN( concise )   DURATION_BEGIN( "test", test_begin, test_end, test_duration, concise )
#endif

#ifndef TEST_DURATION_END
#define TEST_DURATION_END( concise )     DURATION_END( "test", test_begin, test_end, test_duration, concise )
#endif

