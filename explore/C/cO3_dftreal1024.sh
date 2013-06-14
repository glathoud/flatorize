#!/usr/bin/env bash

set -v
#
# Compiling
#
# quite long - uncomment if needed
# gcc -O3 -fomit-frame-pointer -mtune=native -malign-double -fstrict-aliasing -fno-schedule-insns -ffast-math -c -o cO3_dftreal1024_common.o    cO3_dftreal1024_common.c  # Same optimization flags as used by in FFTW3.3.3
gcc -o cO3_dftreal1024_print_NITER.bin    cO3_dftreal1024_common.o cO3_dftreal1024_print_NITER.c 
#
gcc -o cO3_dftreal1024fftw3real.bin          cO3_dftreal1024_common.o cO3_dftreal1024fftw3real.c -lfftw3 -lm
gcc -o cO3_dftreal1024flat_hh.bin           cO3_dftreal1024_common.o cO3_dftreal1024flat_hh.c
# xxx gcc -o cO3_dftreal1024fftw3real_measure.bin          cO3_dftreal1024_common.o cO3_dftreal1024fftw3real_measure.c -lfftw3 -lm -lrt
#
# Testing
#
cO3_dftreal1024_print_NITER.bin
#
#--- Comparison: compute only X[0..1+N/2] because x is a real signal
#
time cO3_dftreal1024fftw3real.bin
#
time cO3_dftreal1024flat_hh.bin
#
set +v