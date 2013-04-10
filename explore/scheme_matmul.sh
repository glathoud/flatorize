#!/usr/bin/env bash

reset
set -v
# First, time the interpretation of the .scm files:

time scheme_matmul_classic.scm          # Ugly imperative implementation, ported from ../examples.js

time scheme_matmul_classic2.scm         # Ugly imperative implementation, ported from ../examples.js

time scheme_matmul_list_of_lists.scm    # Concise functional implementation from rosettacode.org

time scheme_matmul342.scm               # Proposed "flatorized" implementation for I:3,J:4,K:2

# Compile them:

( cat scheme_matmul_common.scm ; grep -v load scheme_matmul_classic.scm ) | grep -v gsi-script > tmp.scm
gsc -exe -o scheme_matmul_classic.bin tmp.scm
rm tmp.scm

( cat scheme_matmul_common.scm ; grep -v load scheme_matmul_classic2.scm ) | grep -v gsi-script > tmp.scm
gsc -exe -o scheme_matmul_classic2.bin tmp.scm
rm tmp.scm

( cat scheme_matmul_common.scm ; grep -v load scheme_matmul_list_of_lists.scm ) | grep -v gsi-script > tmp.scm
gsc -exe -o scheme_matmul_list_of_lists.bin tmp.scm
rm tmp.scm

( cat scheme_matmul_common.scm ; grep -v load scheme_matmul342.scm ) | grep -v gsi-script > tmp.scm
gsc -exe -o scheme_matmul342.bin tmp.scm
rm tmp.scm

# Done compiling. Now time the binaries:

time scheme_matmul_classic.bin          # Ugly imperative implementation, ported from ../examples.js

time scheme_matmul_classic2.bin         # Ugly imperative implementation, ported from ../examples.js

time scheme_matmul_list_of_lists.bin    # Concise functional implementation from rosettacode.org

time scheme_matmul342.bin               # Proposed "flatorized" implementation for I:3,J:4,K:2

set +v
