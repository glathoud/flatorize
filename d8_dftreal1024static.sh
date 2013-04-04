#!/usr/bin/env sh
# 
# Convenience wrapper to reproduce this issue:
# http://code.google.com/p/v8/issues/detail?id=2612
SETUPCODE=''
if [ $# -gt 0 ]
then
    SETUPCODE="var NITER=$1"
fi
d8 -e "$SETUPCODE; load('v8_dftreal1024static.js');"
