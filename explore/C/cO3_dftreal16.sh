#!/usr/bin/env bash

set -v
#
# Compiling
#
gcc -O3 -fomit-frame-pointer -mtune=native -malign-double -fstrict-aliasing -fno-schedule-insns -ffast-math -c -o cO3_dftreal16_common.o    cO3_dftreal16_common.c  # Same optimization flags as used by in FFTW3.3.3
gcc -o cO3_dftreal16_print_NITER.bin    cO3_dftreal16_common.o cO3_dftreal16_print_NITER.c 
gcc -o cO3_dftreal16fftw3.bin          cO3_dftreal16_common.o cO3_dftreal16fftw3.c -lfftw3 -lm
gcc -o cO3_dftreal16fftw3real.bin          cO3_dftreal16_common.o cO3_dftreal16fftw3real.c -lfftw3 -lm
gcc -o cO3_dftreal16flat.bin           cO3_dftreal16_common.o cO3_dftreal16flat.c
#
# Testing
#
cO3_dftreal16_print_NITER.bin
#
time cO3_dftreal16fftw3.bin
#
time cO3_dftreal16fftw3real.bin
#
time cO3_dftreal16flat.bin
#
set +v