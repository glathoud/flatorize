#!/usr/bin/env python3

import json, pprint, sys
sys.path.append( '..' )

from common import *

def speed_test_dftreal_flatorize_asmjs_v8( dftsize, verbose = True ):

    ret = {}

    for one in ({ PREFIX : 'flatorize_asmjs_64bit_v8', PRECISION : PRECISION_DOUBLE, },
                { PREFIX : 'flatorize_asmjs_32bit_v8', PRECISION : PRECISION_SINGLE, },
                ):

        prefix    = one[ PREFIX ]
        precision = one[ PRECISION ]
    
        jscode_li = [
            'load(\'test/speed_test_c_fftw/dftreal_n.js\');',
            'log=function(){}; /*no logging*/',
            'var o = dftreal_n_speed_test_flatorize_asmjs( {0}, null, null, {{precision:\'{1}\'}} );'.format( dftsize, precision ),
            'print(JSON.stringify(o));',
            ]

        if verbose:
            print()
            print('prefix: {0}, precision: {1}'.format( prefix, precision ))
            print( __file__ + ': start V8, let it load "dftreal_n.js", and run "dftreal_n_speed_test_flatorize_asmjs( {0} )".'.format( dftsize ) )
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

        ret[ prefix ] = { RESULT : outobj, META : meta_v8(), PARAM : { PRECISION : precision } }

    return ret

if __name__ == '__main__':
    speed_test_dftreal_flatorize_asmjs_v8( dftsize = int( sys.argv[ 1 ] ), verbose = True )
    
