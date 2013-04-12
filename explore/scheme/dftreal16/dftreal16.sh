#!/usr/bin/env bash

reset
dftreal16_NITER.scm
set -v
# Gambit-C version

gsi -v

# First, time the interpretation of the .scm files:

time dftreal16_baseline.scm          # Baseline implementation of the DFT

time dftreal16_cooley_tukey_func.scm # Cooley-Tukey implementation of the DFT (purely functional)

time dftreal16_cooley_tukey.scm      # Cooley-Tukey implementation of the DFT (minimal use of vector-set!)

time dftreal16_flat.scm              # Proposed "flatorized" implementation for N:16

# Compile them:

cat util.scm dftreal16_common.scm dftreal_baseline.scm dftreal16_baseline.scm | grep -v load | grep -v gsi-script > tmp.scm
gsc -exe -o dftreal16_baseline.bin tmp.scm
rm tmp.scm

cat util.scm dftreal16_common.scm dftreal_cooley_tukey_func.scm dftreal16_cooley_tukey_func.scm | grep -v load | grep -v gsi-script > tmp.scm
gsc -exe -o dftreal16_cooley_tukey_func.bin tmp.scm
rm tmp.scm

cat util.scm dftreal16_common.scm dftreal_cooley_tukey.scm dftreal16_cooley_tukey.scm | grep -v load | grep -v gsi-script > tmp.scm
gsc -exe -o dftreal16_cooley_tukey.bin tmp.scm
rm tmp.scm

cat util.scm dftreal16_common.scm dftreal16_flat.scm | grep -v load | grep -v gsi-script > tmp.scm
gsc -exe -o dftreal16_flat.bin tmp.scm
rm tmp.scm

# Done compiling. Now time the binaries:

time dftreal16_baseline.bin          # Baseline implementation of the DFT

time dftreal16_cooley_tukey_func.bin # Cooley-Tukey implementation of the DFT (purely functional)

time dftreal16_cooley_tukey.bin      # Cooley-Tukey implementation of the DFT (minimal use of vector-set!)

time dftreal16_flat.bin              # Proposed "flatorized" implementation for N:16

set +v
