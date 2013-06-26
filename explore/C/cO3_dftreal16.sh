#!/usr/bin/env bash

set -v
#
# Compiling
#
gcc -O3 -fomit-frame-pointer -mtune=native -malign-double -fstrict-aliasing -fno-schedule-insns -ffast-math    -lrt   -c -o cO3_dftreal16_common.o    cO3_dftreal16_common.c  # Same optimization flags as used by in FFTW3.3.3  +  -lrt for time.h
gcc -o cO3_dftreal16_print_NITER.bin    cO3_dftreal16_common.o cO3_dftreal16_print_NITER.c 
#
gcc -o cO3_dftreal16fftw3.bin          cO3_dftreal16_common.o cO3_dftreal16fftw3.c -lfftw3 -lm   -lrt
gcc -o cO3_dftreal16flat.bin           cO3_dftreal16_common.o cO3_dftreal16flat.c   -lrt
gcc -o cO3_dftreal16fftw3real.bin          cO3_dftreal16_common.o cO3_dftreal16fftw3real.c -lfftw3 -lm   -lrt
gcc -o cO3_dftreal16flat_hh.bin           cO3_dftreal16_common.o cO3_dftreal16flat_hh.c   -lrt
gcc -o cO3_dftreal16flat_sr_hh.bin           cO3_dftreal16_common.o cO3_dftreal16flat_sr_hh.c   -lrt
gcc -o cO3_dftreal16flat_msr_hh.bin           cO3_dftreal16_common.o cO3_dftreal16flat_msr_hh.c   -lrt
gcc -o cO3_dftreal16fftw3real_measure.bin          cO3_dftreal16_common.o cO3_dftreal16fftw3real_measure.c -lfftw3 -lm    -lrt
#
# Testing
#
cO3_dftreal16_print_NITER.bin
#
#--- First comparison: compute the full X[0..N-1], ignoring that x is a real signal
#
./cO3_dftreal16fftw3.bin
#
./cO3_dftreal16flat.bin
#
#--- Second comparison: compute only X[0..1+N/2] because x is a real signal
#
./cO3_dftreal16fftw3real.bin
#
./cO3_dftreal16flat_hh.bin
#
./cO3_dftreal16flat_sr_hh.bin
#
./cO3_dftreal16flat_msr_hh.bin
#
set +v