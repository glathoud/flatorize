#!/usr/bin/env python3

import json, math, os, pprint, re, sys
sys.path.append( '..' )

from common import *

def speed_test_dftreal1024_fftw3( verbose = True ):

    if verbose:
        print()
        print( 'Compile the FFTW3 implementation...' )
        sys.stdout.flush()

    #

    outstr = sh_call( 'compile_dftreal1024_fftw3real.sh' )
    
    # Make sure it really worked

    rx = re.compile( r'^\s*NITER: \s*(?P<niter>\S+)$[\s\S]+^\s*test\s+duration:[\s\S]+/(?P<filename>\S+_measure.bin)\s*$[\s\S]+^\s*test\s+duration:\s+(?P<duration>\S+)\s+seconds', re.MULTILINE )
    mo = rx.search( outstr )
    
    niter_s = mo.group( 'niter' )
    duration_s = mo.group( 'duration' )

    niter = float( niter_s )
    assert not math.isnan( niter )
    
    duration = float( duration_s )
    assert not math.isnan( duration )

    filename = os.path.join( 'fftw3.outdir', mo.group( 'filename' ) )
    assert os.path.exists( filename )
    assert os.path.isfile( filename )

    # Run the speed test 

    if verbose:
        print()
        print( 'Measure the speed of the FFTW3 implementation...' )
        sys.stdout.flush()

    return sh_speed_test( filename, verbose_prefix = verbose  and  '' )

if __name__ == '__main__':
    speed_test_dftreal1024_fftw3( verbose = True )
    
