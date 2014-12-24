#!/usr/bin/env python3

import json, math, os, pprint, re, sys
sys.path.append( '..' )

from common import *

def speed_test_dftreal_fftw3real( dftsize, verbose = True ):
    ret = {}

    for prefix in ('fftw3', 'fftw3_f_',):

        if verbose:
            print()
            print('-' * 20)
            print('prefix: ' + prefix)


        if verbose:
            print()
            print( 'Compile the FFTW3 implementation...' )
            sys.stdout.flush()


        #

        outstr = sh_call( prefix + 'real_compile.sh', opt = str( dftsize ) )

        # Make sure it really worked

        rx = re.compile( r'^\s*export\s+OUTDIR=(?P<quote>[\'"])(?P<outdir>\S+)(?P=quote)[\s\S]+/\$OUTDIR/(?P<pathless>[^\/]+?_measure\.bin).*?$\s*(?P<duration_0>\S+)\s*$\s*(?P<duration_1>\S+)', re.MULTILINE )
    #    rx = re.compile( r'^\s*export\s+OUTDIR=(?P<quote>[\'"])(?P<outdir>\S+)(?P=quote)[\s\S]+^\s*test\s+duration:[\s\S]+/(?P<filename>\S+_measure.bin)\s*$[\s\S]+^\s*test\s+duration:\s+(?P<duration>\S+)\s+seconds', re.MULTILINE )
        mo = rx.search( outstr )

        outdir = mo.group( 'outdir' )
        assert outdir

        pathless = mo.group( 'pathless' )
        assert pathless

        for name in ('duration_0','duration_1',):
            duration_s = mo.group( name )

            duration = float( duration_s )
            assert not math.isnan( duration )

        filename = os.path.join( outdir, pathless )
        assert os.path.exists( filename )
        assert os.path.isfile( filename )

        if verbose:
            print(filename)

        # Run the speed test 

        if verbose:
            print()
            print( 'Measure the speed of the ' + prefix + ' implementation...' )
            sys.stdout.flush()

        ret[ prefix + 'real_gcc' ] = { 
                RESULT  : sh_speed_test( '{0} {1}'.format( filename, dftsize ), verbose_prefix = verbose  and  '' )
                 , META : meta_gcc()
                }

        if verbose:
            print()

    return ret

if __name__ == '__main__':
    speed_test_dftreal_fftw3real( int( sys.argv[ 1 ] ), verbose = True )
    
