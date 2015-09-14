#!/usr/bin/env sh

set -v
cd ~/d/glathoud/
export A=flatorize.`date +"%Y-%m-%d-%Hh%M"`.tar.gz ; tar zcf $A flatorize ; cp $A /media/alpstein/USB30FD/
cd -
set +v
ls -lrt /media/alpstein/USB30FD/ | tail -1
