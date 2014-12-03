#!/usr/bin/env bash

set -v
rm *.s *.o *.bin
#
# Compiling
#
gcc -g -Wa,-a,-ad=dftreal1024_common.s     -O3 -fomit-frame-pointer -mtune=native -malign-double -fstrict-aliasing -fno-schedule-insns -ffast-math   -lrt    -c -o dftreal1024_common.o    dftreal1024_common.c  # Same optimization flags as used by in FFTW3.3.3  +  -lrt for the time tests

gcc -o dftreal1024_print_NITER.bin    dftreal1024_common.o dftreal1024_print_NITER.c 
#
gcc -o dftreal1024fftw3real.bin          dftreal1024_common.o dftreal1024fftw3real.c -lfftw3 -lm  -lrt
gcc -o dftreal1024fftw3real_measure.bin          dftreal1024_common.o dftreal1024fftw3real_measure.c -lfftw3 -lm -lrt
#
# Testing
#
./dftreal1024_print_NITER.bin
#
#--- Comparison: compute only X[0..1+N/2] because x is a real signal
#
./dftreal1024fftw3real.bin
#
./dftreal1024fftw3real_measure.bin
#
set +v
