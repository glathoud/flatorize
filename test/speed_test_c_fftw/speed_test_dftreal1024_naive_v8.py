#!/usr/bin/env python3

import json, os, pprint, sys
sys.path.append( '..' )

from common import *

def speed_test_dftreal1024_naive_v8( verbose = True ):

    jscode_li = [
        'load(\'test/speed_test_c_fftw/dftreal1024.js\');',
        'log=function(){}; /*no logging*/',
        'var o = dftreal1024_speed_test_naive();',
        'print(JSON.stringify(o));',
        ]
    
    if verbose:
        print()
        print( 'dftreal1024_v8_test.py: start V8, let it load "dftreal1024.js", and run "dftreal1024_speed_test_naive()".' )
        print()
        print( os.linesep.join( '  ' + line  for  line in jscode_li ) )
        print()
        print( 'Please be patient...', end='' )
        sys.stdout.flush()

    #

    jscode = ' '.join( jscode_li )
    
    outstr = d8_call( jscode )
    outobj = json.loads( outstr )

    if verbose:
        print()
        print( 'Done!' )
        print()
        pprint.pprint( outobj )
        print()

    return { 'naive_v8' : { RESULT : outobj, META : meta_v8() } }

if __name__ == '__main__':
    speed_test_dftreal1024_naive_v8( verbose = True )
    
