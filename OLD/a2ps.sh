#!/usr/bin/env sh
find . -name 'cplx_v?.js' -exec a2ps -o {}.ps -r --columns=2 --file-align=fill {} \;
