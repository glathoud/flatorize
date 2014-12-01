#!/usr/bin/env python3

import json, math, os, pprint, re, stat, sys, traceback

from common import *

from test_c import test_c, SRCDIR, OUTDIR, assert_test

def test_c_speed( verbose = True ):

    srcdir = get_test_dirname( SRCDIR )
    outdir = get_test_dirname( OUTDIR )

    name = 'asmjs_dftreal1024flat_check'

    if verbose:
        print()
        print( 'test_c_speed: (1) make sure all C unit tests pass...', end="" )
        sys.stdout.flush()

    # xxx assert test_c( verbose = False )

    if verbose:
        print( ' ok!' )
    
    if verbose:
        print()
        print( 'test_c_speed: (2) produce a C implementation for asmjs_dftreal1024 (and evaluate the speed in V8)' )

    jscode = ' '.join( [ 'load(\'asmjs/tests.js\');'

                         , 'var passed;'
                         , 'for (var name in passed) if (!passed[ name ]) throw new Error(\'Not all asm.js test passed: failed on at least: \' + name + \'.\');'

                         , 'if (!flatorize.getCodeC) load( \'flatorize_c.js\' );'
                         , 'var output = {};'

                         , 'var name = \'' + name + '\';'

                         , '  var asmjs_info = passed_asmjsgen_info[ name ]'
                         , '  ,   cfg        = Object.create( asmjs_info.cfg )'
                         , '  ;'
                         , '  cfg.helper_h_name = name + \'.h\';'

                         , '  var o = flatorize.getCodeC( cfg );'

                         , '  delete o.helper_h; delete o.helper_c;'  # drop functions because uninteresting for JSON

                         , '  o.' + ASMJS_TEST_INPUT + '  = asmjs_info.input;'
                         , '  o.' + ASMJS_TEST_OUTPUT + ' = asmjs_info.output;'

                         , '  output[ name ] = o;'
                         
                         # Evaluate the speed in V8
                         # xxx


                         , 'print( JSON.stringify( output ) );'
                         ]
                       )

    infomap_str = d8_call( jscode )
    infomap     = json.loads( infomap_str )

    out_arr = []

    name_li = sorted( infomap.keys() )

    for name in name_li:
        info = infomap[ name ]
        try:
            assert_test( name, info, outdir, verbose )
        except Exception as exc:
            if verbose:
                print()
                print( '...caught an exception: ' )
                traceback.print_exc()
            out_arr.append( { NAME : name, OK : False } )
            continue

        out_arr.append( { NAME : name, OK : True } )

    assert 1 == len( out_arr )
    assert name == out_arr[ 0 ][ NAME ]
    assert True == out_arr[ 0 ][ OK ] 
    
    if verbose:
        print()
        print( 'test_c_speed: (3) evaluate the speed of the C implementation of asmjs_dftreal1024' )
        

    filename_base     = os.path.join( outdir, name )
    filename_test_c   = filename_base + '_test.c'

    extless = os.path.splitext( filename_test_c )[ 0 ]
    filename_test_bin = extless + '.bin'

    n = 1
    while True:
        bin_out = sh_call( '{0} {1}'.format( filename_test_bin, n ) )
        duration_sec = float( bin_out )
        assert not math.isnan( duration_sec )

        if 1.0 < duration_sec:
            break
        else:
            n = n << 1
        

    iter_per_sec = n / duration_sec

    print('test_c_speed done, result: {0} iterations/second = {1} iterations / {2} seconds'.format( 
            iter_per_sec, n, duration_sec 
            )
          )


if __name__ == '__main__':
    test_c_speed( verbose = True )
