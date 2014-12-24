#!/usr/bin/env bash

export N=$1

if [ -z "$N" ]
then
    echo "Give me N (e.g. 1024)"
    exit 1
fi
    

set -v
export OUTDIR='fftw3_f_real.outdir'
mkdir -p $OUTDIR
rm -f $OUTDIR/*
#
# Compiling
#
gcc -O3 -fomit-frame-pointer -mtune=native -malign-double -fstrict-aliasing -fno-schedule-insns -ffast-math  -lm -lrt   -c -o $OUTDIR/fftw3real_common.o    fftw3real_common.c  # Same optimization flags as used by in FFTW3.3.3  +  -lrt for the time tests

gcc -o $OUTDIR/fftw3real.bin          $OUTDIR/fftw3real_common.o fftw3_f_real_main.c -lfftw3f -lm  -lrt
gcc -o $OUTDIR/fftw3real_measure.bin          $OUTDIR/fftw3real_common.o fftw3_f_real_measure_main.c -lfftw3f -lm -lrt
#
# Testing
#
./$OUTDIR/fftw3real.bin $N 1
#
./$OUTDIR/fftw3real_measure.bin $N 1
#
set +v
