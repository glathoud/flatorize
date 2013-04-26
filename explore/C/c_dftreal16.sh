#!/usr/bin/env bash

set -v
#
# Compiling
#
gcc -o c_dftreal16_print_NITER.bin    c_dftreal16_print_NITER.c 
# xxx gcc -o c_dftreal16_cooley_tukey.bin   c_dftreal16_cooley_tukey.c
gcc -o c_dftreal16flat.bin           c_dftreal16flat.c
#
# Testing
#
c_dftreal16_print_NITER.bin
#
# xxx time c_dftreal16_cooley_tukey.bin
#
time c_dftreal16flat.bin
#
set +v