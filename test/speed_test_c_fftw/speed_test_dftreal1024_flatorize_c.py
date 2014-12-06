#!/usr/bin/env python3

import json, os, pprint, shutil, stat, sys
sys.path.append( '..' )

from common import *

# reuse constants
from test_c import CUSTOM_INIT_C_CODE, INDENT, PREFIX_INPUT_DATA, SRCDIR, STRUCT_NAME_INSTANCE

# reuse test code generation tool
from test_c import call_sh_assert_ok, copy_src, test_c_code, test_compile_sh_code


OUTDIR = 'speed_test_dftreal1024_flatorize_c.outdir'

def speed_test_dftreal1024_flatorize_c( verbose = True ):

    jscode_li = [
        'load(\'test/speed_test_c_fftw/dftreal1024.js\');',
        'log=function(){}; /*no logging*/',
        'var o = dftreal1024_getCodeC();',
        'print(JSON.stringify(o));',
        ]
    
    if verbose:
        print()
        print( 'start V8, let it load "dftreal1024.js", and run "dftreal1024_getCodeC()".' )
        print()
        print( os.linesep.join( INDENT + line  for  line in jscode_li ) )
        print()
        print( 'Please be patient...', end='' )
        sys.stdout.flush()

    jscode = ' '.join( jscode_li )
    
    outstr = d8_call( jscode )
    info   = json.loads( outstr )

    #

    input_name = 'arr'

    info[ CUSTOM_INIT_C_CODE ] = INDENT + 'memcpy( ' + info[ STRUCT_NAME_INSTANCE ] + '->' + input_name + ', x_randreal_1024, ' + info[ STRUCT_NAME_INSTANCE ] + '->' + input_name.upper() + '_NBYTES );'

    #

    outdir = OUTDIR

    if verbose:
        print()
        print( 'About to setup outdir: ' + outdir )
        print()

    ensure_dir( outdir, empty = True )

    #
    
    filename_h      = os.path.abspath( os.path.join( outdir, info[ 'cfg' ][ 'helper_h_name' ] ) )
    extless         = extless_from( filename_h )
    filename_c      = extless + '.c'
    filename_speed_test_c   = extless + '_speed_test.c'
    filename_speed_test_sh  = extless + '_speed_test.sh'
    filename_speed_test_bin = extless + '_speed_test.bin'

    srcdir = os.path.join( '..', SRCDIR )
    copy_src( srcdir, outdir, verbose_prefix = INDENT  if  verbose  else  None)

    if verbose:
        print()
        print( INDENT + 'About to write: ' + filename_h )
    open( filename_h, 'wb' ).write( info[ 'helper_h_dfltcode' ].encode( ENCODING ) )

    if verbose:
        print( INDENT + 'About to write: ' + filename_c )
    open( filename_c, 'wb' ).write( info[ 'helper_c_dfltcode' ].encode( ENCODING ) )

    if verbose:
        print( INDENT + 'About to write: ' + filename_speed_test_c )
    open( filename_speed_test_c, 'wb' ).write( test_c_code( info, pathless_from( filename_h ) ).encode( ENCODING ) )
    
    if verbose:
        print( INDENT + 'About to write: ' + filename_speed_test_sh )
    open( filename_speed_test_sh, 'wb' ).write( test_compile_sh_code( info, pathless_from( filename_h ), pathless_from( filename_c ), pathless_from( filename_speed_test_c ) ).encode( ENCODING )  )
    os.chmod( filename_speed_test_sh, stat.S_IRWXU )

    #

    if verbose:
        print()
        print('Compile and check')

    call_sh_assert_ok( filename_speed_test_sh, filename_speed_test_bin, verbose = verbose )

    #

    if verbose:
        print()
        print('Run the speed test')
        print()

    return sh_speed_test( filename_speed_test_bin, verbose_prefix = verbose  and  '' )

if __name__ == '__main__':
    speed_test_dftreal1024_flatorize_c( verbose = True )
    