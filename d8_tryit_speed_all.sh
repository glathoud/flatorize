#!/usr/bin/env sh
# Strangely the first pass alone `tryit_all()` was pretty bad: the tests with dft512 and dft1024 almost froze my system.
# In Chrome, at the second pass, things became much better, so I tried something similar here with V8: two passes.
# Maybe the V8 interpreter needs a bit of time to finish the optimization of the big DFT functions.
d8 -e 'load("examples.js"); tryit_all( null, { except : { dft512: 1, dft1024: 1 } , npass : 2 } );'
