#!/usr/bin/env bash

set -v
#
# Compiling
gcc -O3 -c -o cO3_matmul_common.o    cO3_matmul_common.c
gcc -o cO3_print_NITER.bin    cO3_matmul_common.o cO3_print_NITER.c 
gcc -o cO3_matmul_classic.bin cO3_matmul_common.o cO3_matmul_classic.c 
gcc -o cO3_matmul342.bin      cO3_matmul_common.o cO3_matmul342.c      
#
# Testing
#
cO3_print_NITER.bin
#
time cO3_matmul_classic.bin
#
time cO3_matmul342.bin
#
set +v
