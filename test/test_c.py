#!/usr/bin/env python3

import json, os

from common import *

OUTDIR = os.path.join( TESTDIR, 'test_c.outdir' )

def test_c( verbose=True ):
    
    if verbose:
        print( '' )
        print( 'Running `test_c`...')
        
    #

    outdir = os.path.join( os.getcwd(), OUTDIR )

    if verbose:
        print( '' )
        print( '  test_c: 0. setup outdir: ' + outdir )

    ensure_dir( outdir, empty = True )

    #

    if verbose:
        print()
        print( '  test_c: 1. pass all asm.js tests, 2. get their configuration and generate C code...' )

    jscode = ' '.join( [ 'load(\'asmjs/tests.js\');'
                         , 'var out = [], _emptyObj = {};'
                         , 'for (var k in passed) {'
                         ,   'if (!(k in _emptyObj)) {'
                         ,     'var one = {};'
                         ,     'one[\'' + OK + '\'] = passed[ k ];'
                         ,     'one[ \'' + NAME + '\' ] = k;'
                         ,     'out.push( one );'
                         ,   '}'
                         , '}'

                         , 'var passed;'
                         , 'for (var name in passed) if (!passed[ name ]) throw new Error(\'Not all asm.js test passed.\');'

                         , 'if (!flatorize.getCodeC) load( \'flatorize_c.js\' );'
                         , 'var output = {};'
                         , 'for (var name in passed_asmjsgen_info) {'
                         , '  var o = flatorize.getCodeC( passed_asmjsgen_info[ name ].cfg );'
                         , '  output[ name ] = { code : o.code, code_h : o.helper_h(), code_c : o.helper_c() };'
                         , '}'
                         
                         , 'print( JSON.stringify( output ) );'
                         ]
                       )

    infomap_str = d8_call( jscode )
    
    if verbose:
        print()
        print( '  test:c: 3. write out .h and .c files for each example...' )

    infomap = json.loads( infomap_str )

    for name,info in infomap.items():
        filename_base = os.path.join( outdir, name )
        filename_h    = filename_base + '.h'
        filename_c    = filename_base + '.c'

        if verbose:
            print()
            print( '    ' + filename_h )
        open( filename_h, 'wb' ).write( info[ 'code_h' ].encode( ENCODING ) )

        if verbose:
            print( '    ' + filename_c )
        open( filename_c, 'wb' ).write( info[ 'code_c' ].encode( ENCODING ) )


    None.xxx_rest_todo

    if verbose:
        print( '...done with `test_c`: {0}'.format( summary( outstr )[ MESSAGE ] ) )

    if outstr:
        return list( json.loads( outstr ) )
    
    return ( { OK : False, NAME : 'asmjs.py call to V8 failed somewhere.' }, )


if __name__ == '__main__':
    test_c( verbose=True )
