#!/usr/bin/env python3

import glob, json, os, sys

from speed_test_dftreal_all import speed_test_dftreal_all

sys.path.append( '..' )
from common import *


def OUTDIR_RESULTS( dftsize ):
    return 'dftreal{0}.results'.format( dftsize )

def OUTFILE_RESULTLIST( dftsize ):
    return OUTDIR_RESULTS( dftsize ) + '.list.json'

def dftreal_write_json( dftsize = None, environment_name = None, verbose = True ):

    assert dftsize          and isinstance( dftsize, int )
    assert environment_name and isinstance( environment_name, str )
    
    pathless = environment_name + '.json'

    dirname            = OUTDIR_RESULTS( dftsize )
    outfile_resultlist = OUTFILE_RESULTLIST( dftsize )

    if not os.path.exists( dirname ):
        os.makedirs( dirname )

    filename = os.path.join( dirname, pathless )
    
    if verbose:
        print( 'Running the speed tests' )

    old_wd = os.getcwd()
    result = speed_test_dftreal_all( dftsize = dftsize, verbose_level = 1 if verbose else 0 )
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
        print( 'Writing: ' + outfile_resultlist )

    open( outfile_resultlist, 'wb' ).write( 
        json.dumps( glob.glob( os.path.join( dirname, '*.json' ) ) )
        .encode( ENCODING ) 
        )

if __name__ == '__main__':

    if 3 != len( sys.argv ):
        print( 'Usage: ' + os.path.split( __file__ )[ 1 ] + ' <dftsize> <environment_name>  (e.g. 1024 i5_t420s_ubuntu14.04)', file=sys.stderr )
    else:
        dftreal_write_json( dftsize = int( sys.argv[ 1 ] ), environment_name = sys.argv[ 2 ] )
