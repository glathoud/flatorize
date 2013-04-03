#!/usr/bin/env bash

index.scm
echo '_upload.sh: uploading "flatorize" article...'
find . -name '*~' -exec rm {} \;
echo "mkdir flatorize
cd flatorize
mput -rf *.scm *.html *.js *.TXT *.xcf *.jpg *.sh
" | ncftp glat
echo '_upload.sh: upload successful!'
