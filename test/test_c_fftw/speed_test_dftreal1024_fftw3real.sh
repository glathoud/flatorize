#!/usr/bin/env bash

set -v
export OUTDIR='fftw3.outdir'
mkdir -p $OUTDIR
rm -f $OUTDIR/*.s $OUTDIR/*.o $OUTDIR/*.bin
#
# Compiling
#
gcc -g -Wa,-a,-ad=$OUTDIR/dftreal1024_common.s     -O3 -fomit-frame-pointer -mtune=native -malign-double -fstrict-aliasing -fno-schedule-insns -ffast-math   -lrt    -c -o $OUTDIR/dftreal1024_common.o    dftreal1024_common.c  # Same optimization flags as used by in FFTW3.3.3  +  -lrt for the time tests

gcc -o $OUTDIR/dftreal1024_print_NITER.bin    $OUTDIR/dftreal1024_common.o dftreal1024_print_NITER.c 
#
gcc -o $OUTDIR/dftreal1024fftw3real.bin          $OUTDIR/dftreal1024_common.o dftreal1024fftw3real.c -lfftw3 -lm  -lrt
gcc -o $OUTDIR/dftreal1024fftw3real_measure.bin          $OUTDIR/dftreal1024_common.o dftreal1024fftw3real_measure.c -lfftw3 -lm -lrt
#
# Testing
#
./$OUTDIR/dftreal1024_print_NITER.bin
#
#--- Comparison: compute only X[0..1+N/2] because x is a real signal
#
./$OUTDIR/dftreal1024fftw3real.bin
#
./$OUTDIR/dftreal1024fftw3real_measure.bin
#
set +v
