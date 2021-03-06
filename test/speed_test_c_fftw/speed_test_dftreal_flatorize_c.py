#!/usr/bin/env python3

import json, os, pprint, shutil, stat, sys
sys.path.append( '..' )

from common import *

# reuse constants
from test_c import CUSTOM_INIT_C_CODE, INDENT, PREFIX_INPUT_DATA, SRCDIR, STRUCT_NAME_INSTANCE

# reuse test code generation tool
from test_c import call_sh_assert_ok, copy_src, test_c_code, test_compile_sh_code


def OUTDIR( dftsize ):
    return 'speed_test_dftreal_flatorize_c.{0}.outdir'.format( dftsize )

def speed_test_dftreal_flatorize_c( dftsize, verbose = True ):

    ret = {}

    for one in ({ PREFIX : 'flatorize_c_64bit_', PRECISION : PRECISION_DOUBLE, },
                { PREFIX : 'flatorize_c_32bit_', PRECISION : PRECISION_SINGLE, },
                ):

        prefix    = one[ PREFIX ]
        precision = one[ PRECISION ]

        bits64    = precision == 'double'
        bitsname  = '64' if bits64 else '32'

        jscode_li = [
            'load(\'test/speed_test_c_fftw/dftreal_n.js\');',
            'log=function(){}; /*no logging*/',
            'var o = dftreal_n_getCodeC( {0}, {{precision:\'{1}\'}} );'.format( dftsize, precision ),
            'print(JSON.stringify(o));',
            ]

        if verbose:
            print()
            print( __file__ + ': start V8, let it load "dftreal_n.js", and run "dftreal_n_getCodeC( {0} )".'.format( dftsize ) )
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

        info[ CUSTOM_INIT_C_CODE ] = INDENT + 'memcpy( ' + info[ STRUCT_NAME_INSTANCE ] + '->' + input_name + ', get_x_randreal( {0} ), '.format( dftsize ) + info[ STRUCT_NAME_INSTANCE ] + '->' + input_name.upper() + '_NBYTES );'

        #

        outdir = OUTDIR( dftsize )

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

        tmp = extless + '_speed_test.gcc'
        filename_speed_test_gcc_sh  = { False : tmp + '32.sh',  True : tmp + '64.sh' }
        filename_speed_test_gcc_bin = { False : tmp + '32.bin', True : tmp + '64.bin' }

        tmp = extless + '_speed_test.clang'
        filename_speed_test_clang_sh  = { False : tmp + '32.sh',  True : tmp + '64.sh' }
        filename_speed_test_clang_bin = { False : tmp + '32.bin', True : tmp + '64.bin' }

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


        for fn_sh_map,clang in (( filename_speed_test_gcc_sh, False,), ( filename_speed_test_clang_sh, True,),):

            compilname = 'clang' if clang else 'gcc'

            cbname = compilname + bitsname

            fn_sh = fn_sh_map[ bits64 ]

            if verbose:
                print( INDENT + 'About to write: ' + fn_sh )
            open( fn_sh, 'wb' ).write( test_compile_sh_code( info, pathless_from( filename_h ), pathless_from( filename_c ), pathless_from( filename_speed_test_c ), clang = clang, bits64 = bits64 ).encode( ENCODING )  )
            os.chmod( fn_sh, stat.S_IRWXU )

            #

            if verbose:
                print()
                print('Compile and check (' + cbname + ')')
                sys.stdout.flush()

            fn_bin = (
                filename_speed_test_clang_bin if clang else filename_speed_test_gcc_bin
                )[ bits64 ]


            success = False
            old_wd  = os.getcwd()
            try:
                gcc_compicheck_dur_sec = call_sh_assert_ok( fn_sh, fn_bin, verbose = verbose )
                success = True
            except Exception as e:
                os.chdir( old_wd )
                if not bits64:
                    raise e
                else:
                    print( '64-bit support may be missing' )
                    print()

            os.chdir( old_wd )


            if success:
                if verbose:
                    print("done in {0:.3} seconds".format( gcc_compicheck_dur_sec ))
                    print()


        #

        if verbose:
            print()
            print('Run the speed test')
            print()

        for fn_bin_map,compilname in ( (filename_speed_test_gcc_bin,'gcc',), (filename_speed_test_clang_bin, 'clang',),):

            cbname   = compilname + bitsname

            fn_bin = fn_bin_map[ bits64 ]

            success = False
            old_wd  = os.getcwd()
            try:
                result = sh_speed_test( fn_bin, verbose_prefix = verbose  and  (cbname + ': ').ljust(10,' ') )
                success = True
            except Exception as e:
                os.chdir( old_wd )
                if not bits64:
                    raise e
                else:
                    print( '64-bit support may be missing' )
                    print()

            os.chdir( old_wd )

            if success:
                ret[ prefix + cbname ] = {
                    RESULT : result
                    , META : meta( compilname, bitsname = bitsname )
                    , PARAM : { PRECISION : precision }
                    }

    return ret

if __name__ == '__main__':
    speed_test_dftreal_flatorize_c( int( sys.argv[ 1 ] ), verbose = True )

