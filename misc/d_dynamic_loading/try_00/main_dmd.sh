#!/usr/bin/env sh

COMPILO="dmd"
PATH_WHERE_SHARED_LIB_IS="."

rm *.map *.o *.so *.bin 2>>/dev/null

cd "$PATH_WHERE_SHARED_LIB_IS"
rm *.map *.o *.so *.bin 2>>/dev/null

cd -

$COMPILO -c dll.d -fPIC
$COMPILO -oflibdll.so dll.o -shared -defaultlib=libphobos2.so -L-rpath="$PATH_WHERE_SHARED_LIB_IS"

$COMPILO -c main.d
$COMPILO -ofmain.bin main.o -L-ldl -defaultlib=libphobos2.so -L-rpath=".:$PATH_WHERE_SHARED_LIB_IS" -map

./main.bin
