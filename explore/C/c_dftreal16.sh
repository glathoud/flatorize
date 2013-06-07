#!/usr/bin/env bash

set -v
#
# Compiling
#
gcc -o c_dftreal16_print_NITER.bin    c_dftreal16_print_NITER.c 
gcc -o c_dftreal16fftw3.bin          c_dftreal16fftw3.c -lfftw3 -lm
gcc -o c_dftreal16flat.bin           c_dftreal16flat.c
#
# Testing
#
c_dftreal16_print_NITER.bin
#
time c_dftreal16fftw3.bin    # FFTW3 lib was compiled with -O3 (speed advantage)
#
time c_dftreal16flat.bin     # Not compiled with -O3
#
set +v