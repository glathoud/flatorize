#!/usr/bin/env python3

import json, os, pprint, re

from common import *

SRCDIR = 'test_c.srcdir'
OUTDIR = 'test_c.outdir'

def test_c( verbose=True ):
    
    if verbose:
        print( '' )
        print( 'Running `test_c`...')
        
    #

    srcdir = get_test_dirname( SRCDIR )
    outdir = get_test_dirname( OUTDIR )

    if verbose:
        print( '' )
        print( '  test_c: 0. setup outdir: ' + outdir )

    ensure_dir( outdir, empty = True )

    for filename in glob.glob( os.path.join( srcdir, '*.[hc]' )):
        h,t = os.path.split( filename )
        copyname = os.path.join( outdir, t )
        assert filename != copyname, 'must differ'
        shutil.copyfile( filename, copyname )
        print( '  test_c: 0. copied src file to: "{0}"'.format( copyname ) )

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
                         , '  var asmjs_info = passed_asmjsgen_info[ name ];'
                         , '  var o = flatorize.getCodeC( asmjs_info.cfg );'

                         , '  delete o.helper_h; delete o.helper_c;'  # drop functions because uninteresting for JSON

                         , '  o.' + ASMJS_TEST_INPUT + '  = asmjs_info.input;'
                         , '  o.' + ASMJS_TEST_OUTPUT + ' = asmjs_info.output;'

                         , '  output[ name ] = o;'
                         , '}'
                         
                         , 'print( JSON.stringify( output ) );'
                         ]
                       )

    infomap_str = d8_call( jscode )
    infomap     = json.loads( infomap_str )
    
    pprint.pprint( infomap )

    if verbose:
        print()
        print( '  test:c: 3. write out .h, .c and .sh files for each example...' )

    for name,info in infomap.items():

        filename_base = os.path.join( outdir, name )
        filename_h    = filename_base + '.h'
        filename_c    = filename_base + '.c'
        filename_unittest_c = filename_base + '_unit_test.c'

        # Generate implementation files (.h and .c)

        if verbose:
            print()
            print( '    ' + filename_h )
        open( filename_h, 'wb' ).write( info[ 'helper_h_dfltcode' ].encode( ENCODING ) )

        if verbose:
            print( '    ' + filename_c )
        open( filename_c, 'wb' ).write( info[ 'helper_c_dfltcode' ].encode( ENCODING ) )

        # Generate unit test file (.c)

        if verbose:
            print( '    ' + filename_unittest_c )
        open( filename_unittest_c, 'wb' ).write( unittest_c_code( info, filename_h ).encode( ENCODING ) )

    assert False, 'xxx_rest_todo'

    if verbose:
        print( '...done with `test_c`: {0}'.format( summary( outstr )[ MESSAGE ] ) )

    if outstr:
        return list( json.loads( outstr ) )
    
    return ( { OK : False, NAME : 'asmjs.py call to V8 failed somewhere.' }, )


def unittest_c_code( info, filename_h ):

    if info[ HAS_ARRAY ]:
        array_name = 'io_array'

    return '''
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include "common.h"
#include "''' + filename_h + '''"

extern const int   epsilon;

int main()
{
  ''' + ('' if not info[ HAS_ARRAY ] else (info[ ARRAY_TYPE ] + '[] ' + array_name + ' = { ' + os.linesep + arrayinit_c_code( info ) + os.linesep + '  };')) + '''

  const Nhh = 1 + (N >> 1);

  double ** X;

  ALIGNED_MALLOC_CPLX_ARRAY( X, N );  

  /* --- Sanity check --- */

  dftreal1024flat_msr_hh( x_randreal, X );
  
  int ok_all = 1;
  for (i = 0; i < Nhh; i++)
    {
      double*       result_i   = X[ i ];
      const double* expected_i = X_randreal[ i ];
      double  delta_0 = fabs( result_i[ 0 ] - expected_i[ 0 ] );
      double  delta_1 = fabs( result_i[ 1 ] - expected_i[ 1 ] );
      int ok = EPSILON > delta_0  &&  EPSILON > delta_1;
      if (!ok)
        printf( "%d: %g %g, %g %g, %g %g -> ok: %d\n", i, result_i[ 0 ], result_i[ 1 ], expected_i[ 0 ], expected_i[ 1 ], delta_0, delta_1, ok );
      ok_all &= ok;
    }
  /* printf("ok_all: %d\n", ok_all); */
  if (!ok_all)
    {
      fprintf( stderr, "\nERROR: buggy implementation!\n");
      return -1;
    }
  
  /* --- Performance test --- */

  TEST_DURATION_BEGIN;
  
  for (i = NITER ; i-- ; )
    dftreal1024flat_msr_hh( x_randreal, X );
  
  TEST_DURATION_END;

  /* --- Cleanup --- */

  ALIGNED_FREE_CPLX_ARRAY( X, N );  
  
  /* printf("\nDone.\n"); */
  return 0;
}
'''


def arrayinit_c_code( info ):
    
    assert info[ HAS_ARRAY ]
    
    array_test_sorted = get_array_test_sorted( info )

    lines = []

    c_open = comment_c_code( '[' )
    c_close = comment_c_code( ']' )

    indent = '  '

    def push_array_recursive( v, indent_n = 0 ):

        a = indent * indent_n

        if isinstance( v[ 0 ], list ):
            lines.append( a + c_open )
            for x in v:
                push_array_recursive( x, indent_n = indent_n + 1 )
            lines.append( a + c_close )
        else:
            lines.append( a + c_open + ' ' + ''.join( map( lambda v: str( v ) + ', ', v ) ) + ' ' + c_close )   # xxx more precise string conversion needed, depending on type (int)


    i = 0
    for x in array_test_sorted:

        begin = x[ BEGIN ]

        pprint.pprint( x )

        s = []
        while i < begin:
            s.append( '0, ' )
            i += 1
        if s:
            lines.append( ''.join( s ) )

        indent_n_start = 2

        lines.append( '' )
        lines.append( indent * indent_n_start + comment_c_code( ( 'input'  if  x[ IS_INPUT ]  else  'output' ) + ' array "' + x[ NAME ] + '"' ) )
        lines.append( '' )

        push_array_recursive( x[ VALUE ], indent_n = indent_n_start )
        lines.append( '' )
        
        i = x[ END ]
        

    count = info[ ARRAY_COUNT ]
    s = []
    while i < count:
        s.append( '0, ' )
        i += 1
    if s:
        lines.append( ''.join( s ) )

    ret = os.linesep.join( lines )

    lastcomma = ret.rindex( ',' )
    ret = ret[ :lastcomma ] + ret[ lastcomma+1: ]
    return ret


def comment_c_code( s ):
    return '/* ' + s + ' */'

if __name__ == '__main__':
    test_c( verbose=True )
