#!/usr/bin/env python3

import glob, json, os, sys

sys.path.append( '..' )

from common import *

from speed_test_dftreal1024_all import speed_test_dftreal1024_all

OUTDIR_RESULTS = 'dftreal1024.results'
OUTFILE_RESULTLIST   = OUTDIR_RESULTS + '.list.json'

def dftreal1024_write_json( testname = None, verbose = True ):

    if not testname:
        testname = os.path.splitext( os.path.split( __file__ )[ 1 ] )[ 0 ]
        
    pathless = testname + '.json'

    dirname = OUTDIR_RESULTS
    if not os.path.exists( dirname ):
        os.makedirs( dirname )

    filename = os.path.join( dirname, pathless )
    
    if verbose:
        print( 'Running the speed tests' )

    obj = speed_test_dftreal1024_all( verbose_level = 1 if verbose else 0 )

    if verbose:
        print( 'Writing: ' + filename )
    
    open( filename, 'wb' ).write( json.dumps( obj ).encode( ENCODING ) )

    # Also update the list

    if verbose:
        print( 'Writing: ' + OUTFILE_RESULTLIST )

    open( OUTFILE_RESULTLIST, 'wb' ).write( 
        json.dumps( glob.glob( os.path.join( OUTDIR_RESULTS, '*.json' ) ) )
        .encode( ENCODING ) 
        )

if __name__ == '__main__':

    if 2 > len( sys.argv ):
        print( 'Usage: ' + os.path.split( __file__ )[ 1 ] + ' <testname>', file=sys.stderr )
    else:
        dftreal1024_write_json( testname = sys.argv[ 1 ] )
