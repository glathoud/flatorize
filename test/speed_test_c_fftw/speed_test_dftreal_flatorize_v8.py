#!/usr/bin/env python3

import json, os, pprint, sys
sys.path.append( '..' )

from common import *

def speed_test_dftreal_flatorize_v8( dftsize, verbose = True ):

    jscode_li = [
        'load(\'test/speed_test_c_fftw/dftreal_n.js\');',
        'log=function(){}; /*no logging*/',
        'var o = dftreal_n_speed_test_flatorize( {0} );'.format( dftsize ),
        'print(JSON.stringify(o));',
        ]
    
    if verbose:
        print()
        print( __file__ + ': start V8, let it load "dftreal_n.js", and run "dftreal_n_speed_test_flatorize({0})".'.format( dftsize ) )
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

    return { 'flatorize_64bit_v8' : { RESULT : outobj, META : meta_v8(), PARAM : { PRECISION : PRECISION_DOUBLE } } }

if __name__ == '__main__':
    speed_test_dftreal_flatorize_v8( dftsize = int( sys.argv[ 1 ] ), verbose = True )
    
