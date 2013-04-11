#!/usr/bin/env bash

reset
scheme_dft16_NITER.scm
set -v
# First, time the interpretation of the .scm files:

time scheme_dft16_flat.scm              # Proposed "flatorized" implementation for N:16

# Compile them:

cat scheme_util.scm scheme_dft16_common.scm scheme_dft16_flat.scm| grep -v load | grep -v gsi-script > tmp.scm
gsc -exe -o scheme_dft16_flat.bin tmp.scm
rm tmp.scm

# Done compiling. Now time the binaries:

time scheme_dft16_flat.bin              # Proposed "flatorized" implementation for N:16

set +v
