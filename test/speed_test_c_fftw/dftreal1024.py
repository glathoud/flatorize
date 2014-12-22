#!/usr/bin/env python3

import glob, json, os, sys

from speed_test_dftreal1024_all import speed_test_dftreal1024_all

sys.path.append( '..' )
from common import *

OUTDIR_RESULTS = 'dftreal1024.results'
OUTFILE_RESULTLIST   = OUTDIR_RESULTS + '.list.json'

def dftreal1024_write_json( environment_name = None, verbose = True ):

    if not environment_name:
        environment_name = os.path.splitext( os.path.split( __file__ )[ 1 ] )[ 0 ]
        
    pathless = environment_name + '.json'

    dirname = OUTDIR_RESULTS
    if not os.path.exists( dirname ):
        os.makedirs( dirname )

    filename = os.path.join( dirname, pathless )
    
    if verbose:
        print( 'Running the speed tests' )

    old_wd = os.getcwd()
    result = speed_test_dftreal1024_all( verbose_level = 1 if verbose else 0 )
    os.chdir( old_wd )

    obj = {
        RESULT : result
        , ENVIRONMENT_NAME : environment_name
        , FILENAME : filename
        }

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
        print( 'Usage: ' + os.path.split( __file__ )[ 1 ] + ' <environment_name>', file=sys.stderr )
    else:
        dftreal1024_write_json( environment_name = sys.argv[ 1 ] )
