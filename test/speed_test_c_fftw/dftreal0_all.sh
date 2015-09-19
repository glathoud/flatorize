#!/usr/bin/env sh

# $1 should be the environment name, e.g. "i7_dell_ubuntu15.04"

if [ ! $1 ]
then
    echo "Usage: " $0 " <environment_name> (e.g. i7_dell_ubuntu15.04)"
    exit 1
fi

./dftreal0_speed_test.py   16 $1
./dftreal0_speed_test.py   32 $1
./dftreal0_speed_test.py   64 $1
./dftreal0_speed_test.py  128 $1
./dftreal0_speed_test.py  256 $1
./dftreal0_speed_test.py  512 $1
./dftreal0_speed_test.py 1024 $1
