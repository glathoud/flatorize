#!/usr/bin/env bash

set -v
#
# Compiling
#
gcc -O3 -c -o cO3_dftreal16_common.o    cO3_dftreal16_common.c
gcc -o cO3_dftreal16_print_NITER.bin    cO3_dftreal16_common.o cO3_dftreal16_print_NITER.c 
gcc -o cO3_dftreal16flat.bin           cO3_dftreal16_common.o cO3_dftreal16flat.c
gcc -o cO3_dftreal16fftw3.bin          cO3_dftreal16_common.o cO3_dftreal16fftw3.c -lfftw3 -lm
#
# Testing
#
cO3_dftreal16_print_NITER.bin
#
time cO3_dftreal16flat.bin
#
time cO3_dftreal16fftw3.bin
#
set +v