#!/usr/bin/env sh
SETUPCODE=''
if [ $# -gt 0 ]
then
    SETUPCODE="var NITER=$1"
fi
d8 -e "$SETUPCODE; load('v8_dftreal1024static.js');"
