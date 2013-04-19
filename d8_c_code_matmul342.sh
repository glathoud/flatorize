#!/usr/bin/env sh
d8 -e 'load("examples.js"); generate_small_functions(); load("flatorize_c.js"); var c_code_str = flatorize.c( matmul342 ); print( c_code_str );'
