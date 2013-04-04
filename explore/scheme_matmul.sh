#!/usr/bin/env sh

reset
set -v
time scheme_matmul_classic.scm          # Ugly imperative implementation, ported from ../examples.js
time scheme_matmul_list_of_lists.scm    # Concise functional implementation from rosettacode.org
time scheme_matmul342.scm               # Proposed "flatorized" implementation for I:3,J:4,K:2
set +v
