#!/usr/bin/env bash

set -v
#
# Compiling
#
gcc -o c_print_NITER.bin    c_print_NITER.c 
gcc -o c_matmul_classic.bin c_matmul_classic.c
gcc -o c_matmul342.bin      c_matmul342.c
#
# Testing
#
c_print_NITER.bin
#
time c_matmul_classic.bin
#
time c_matmul342.bin
#
set +v