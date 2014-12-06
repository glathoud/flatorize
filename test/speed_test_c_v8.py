#!/usr/bin/env python3

import json, math, os, pprint, re, stat, sys, traceback

from common import *

from test_c import test_c, SRCDIR, OUTDIR, assert_test

def speed_test_v8_c( verbose = True ):

    srcdir = get_test_dirname( SRCDIR )
    outdir = get_test_dirname( OUTDIR )

    name = 'asmjs_dftreal1024flat_check'

    if verbose:
        print()
        print( 'speed_test_v8_c: (1) make sure all C unit tests pass...', end="" )
        sys.stdout.flush()

    assert test_c( verbose = False )

    if verbose:
        print( ' ok!' )
    
    if verbose:
        print()
        print( 'speed_test_v8_c: (2) for the asmjs_dftreal1024 case, evaluate speed in V8 and produce a C implementation' )

    jsspeedtest_filename = os.path.join( outdir, name + '.test_c_v8_speed.js' )
    open( jsspeedtest_filename, 'wb' ).write( ' '.join( [
        'load(\'asmjs/tests.js\');'

        # Make sure all asm.js tests passed
        
        , 'var passed;'
        , 'for (var name in passed) if (!passed[ name ]) throw new Error(\'Not all asm.js test passed: failed on at least: \' + name + \'.\');'
        
        , 'if (!flatorize.getCodeC) load( \'flatorize_c.js\' );'
        , 'var output = {};'
        
        # Produce C code
        
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
        
        , 'var test_body = (asmjs_dftrealflat_check+\'\').match(/^[^\\{]+\{([\\s\\S]+)\\}\\s*$/)[1]'
        , ',   test_func = test_body.match(/\\/\\/#COMPUTE_BEGIN\\s*([\s\S]+?)\\s*\\(\s*\\)\s*\\;\\s*\\/\\/#COMPUTE_END/)[1]'
        , ',   speed_test_body = \'var dftsize = 1024, hermihalf = false;\' + test_body + '
        , '        \'var callfun = \' + test_func + \'; var n = 1, prev_duration = -1; while (true) { var speed_start = Date.now(); for (var i = n; i--;) callfun(); var duration_sec = (Date.now() - speed_start)/1000; if (prev_duration > 1e-3  &&  duration_sec > prev_duration * 4) continue/*rejected (garbage collection)*/; prev_duration = duration_sec; if (duration_sec > 1) break; else n <<= 1; } return { n : n, duration_sec : duration_sec, iter_per_sec : n / duration_sec, test_body : test_body, test_func : test_func, speed_test_body : speed_test_body };\'.replace(/;/g,\';\\n\')'
        , ';'
        , 'o.' + V8_SPEED + ' = new Function( speed_test_body )();'
        
        # Return everything
        
        , 'print( JSON.stringify( output ) );'
        ] ).encode( ENCODING ) )
                                            
    if verbose:
        print()
        print( '  prepared file: ' + jsspeedtest_filename )
        print( '  running it...' )

    infomap_str = d8_call( 'load(\'' + jsspeedtest_filename + '\');' )
    infomap     = json.loads( infomap_str )

    infomap_keys = list( infomap.keys() )
    assert 1 == len( infomap_keys )
    assert name == infomap_keys[ 0 ]
    info     = infomap[ name ]
    v8_speed = info[ V8_SPEED ]
    if verbose:
        print('  speed in V8: {iter_per_sec} iterations/second = {n} iterations / {duration_sec} seconds'.format( 
                **v8_speed 
                  ) 
              )


    if verbose:
        print()
        print( '  produce and compile a C implementation' )
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
        print( 'speed_test_v8_c: (3) evaluate the speed of the C implementation of asmjs_dftreal1024' )
        

    filename_base     = os.path.join( outdir, name )
    filename_test_c   = filename_base + '_test.c'

    extless = os.path.splitext( filename_test_c )[ 0 ]
    filename_test_bin = extless + '.bin'

    return sh_speed_test( filename_test_bin, verbose_prefix = verbose  and   'speed_test_v8_c done, speed in clang: ' )
   
if __name__ == '__main__':
    speed_test_v8_c( verbose = True )
