#!/usr/bin/env bash

set -v
#
# Compiling
#
gcc -o c_dftreal16_print_NITER.bin    c_dftreal16_print_NITER.c 
gcc -o c_dftreal16_cooley_tukey.bin   c_dftreal16_cooley_tukey.c
gcc -o c_dftreal16_flatorized.bin     c_dftreal16_flatorized.c
#
# Testing
#
c_dftreal16_print_NITER.bin
#
time c_dftreal16_cooley_tukey.bin
#
time c_dftreal16_flatorized.bin
#
set +v