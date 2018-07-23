#!/usr/bin/env sh

LDC_DIR="/media/ssd2/software/ldc"
COMPILO="$LDC_DIR/bin/ldmd2"
FULLNAME_SHARED_LIB="$LDC_DIR/lib/libphobos2-ldc-shared.so.2.0.80"

rm *.map *.o *.so *.bin 2>>/dev/null

cd "$PATH_WHERE_SHARED_LIB_IS"
rm *.map *.o *.so *.bin 2>>/dev/null

cd -

$COMPILO -c dll.d -fPIC
$COMPILO -oflibdll.so dll.o -shared -L-rpath="." -L"$FULLNAME_SHARED_LIB"

$COMPILO -c main.d
# $COMPILO -ofmain.bin main.o -L-ldl -L-rpath="." -L"$FULLNAME_SHARED_LIB" -map
# Warning: command-line option '-map' not yet supported by LDC.
$COMPILO -ofmain.bin main.o -L-ldl -L-rpath="." -L"$FULLNAME_SHARED_LIB"

./main.bin
