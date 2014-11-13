#!/usr/bin/env python3

import json, os, pprint, re

from common import *

ARRAY_NAME = 'io_array'

PREFIX_INPUT           = 'input_'
PREFIX_OUTPUT          = 'output_'
PREFIX_EXPECTED_OUTPUT = 'expected_' + PREFIX_OUTPUT

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

    array_name = None
    array_type = None

    if info[ HAS_ARRAY ]:
        array_name = ARRAY_NAME
        array_type = info[ ARRAY_TYPE ]
        

    return '''
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include "common.h"
#include "''' + filename_h + '''"

extern const int   epsilon;

extern ''' + info[ FUN_DECL_CODE ] + ''';

int main( int argc, char **argv )
{
  float tmp;
  int   n_iter_speed = 0;

  if (argc > 1)  
  {
    sscanf( argv[ 1 ], "%g", &tmp );  /* Permit 1.234e5 notation */
    n_iter_speed = tmp | 0;
  }

  ''' + comment_c_code( '--- Input(s) ---') + '''

  ''' + simple_input_init_c_code( info ) + '''
  ''' + ('' if not info[ HAS_ARRAY ] else (array_type + '[] ' + array_name + ' = { ' + os.linesep + arrayinit_c_code( info ) + os.linesep + '  };')) + '''

  ''' + comment_c_code( '--- Expected output ---' ) + '''

  const ''' +(scalar_expected_output_init_c_code( info )  if  not array_expected_output_name( info )  else  (array_type + '[] ' + array_expected_output_name( info ) + ' = { ' + os.linesep + arrayinit_c_code( info, expected_output_alone = True )) + os.linesep + '  };') + '''

  /* --- Unit test --- */

  ''' + call_once_c_code( info ) + '''
  
  ''' + unit_test_output_c_code( info ) + '''

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

def array_expected_output_name( info ):

    tmp = info[ ASMJS_TEST_OUTPUT ][ 0 ][ NAME ] 
    if tmp in info[ ARRAY_NAME2INFO ]:
        return PREFIX_EXPECTED_OUTPUT + tmp
    


def arrayinit_c_code( info, expected_output_alone = False ):
    
    assert info[ HAS_ARRAY ]

    array_type = info[ ARRAY_TYPE ]
    
    array_test_sorted = get_array_test_sorted( info, expected_output_alone = expected_output_alone )

    lines = []

    c_open = comment_c_code( '[' )
    c_close = comment_c_code( ']' )

    indent = '  '

    def push_array_recursive( v, indent_n = 0, is_output = False ):

        a = indent * indent_n

        if isinstance( v[ 0 ], list ):
            lines.append( a + c_open )
            for x in v:
                push_array_recursive( x, indent_n = indent_n + 1, is_output = is_output )
            lines.append( a + c_close )
        else:
            lines.append( a + c_open + ' ' + ''.join( map( lambda v: format_value( 0  if  (is_output and not expected_output_alone)  else  v, array_type ) + ', ', v ) ) + ' ' + c_close )


    i = array_test_sorted[ 0 ][ BEGIN ]  if  expected_output_alone  else  0
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

        is_output = x[ IS_OUTPUT ]

        lines.append( '' )
        lines.append( indent * indent_n_start + comment_c_code( ( 'output'  if  is_output  else  'input' ) + ' array "' + x[ NAME ] + '"' + ( ' (initialization to 0)'  if  (is_output and not expected_output_alone)  else  '') ) )
        lines.append( '' )

        push_array_recursive( x[ VALUE ], indent_n = indent_n_start, is_output = is_output )
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


def simple_input_init_c_code( info ):

    lines = []

    for x in info[ ASMJS_TEST_INPUT ]:
        x_type = info[ TYPED_IN_VAR ][ x[ NAME ]]
        if isinstance( x_type, str ):
            lines.append( 'const ' + x_type + ' ' + PREFIX_INPUT + x[ NAME ] + ' = ' + format_value( x[ VALUE ], x_type ) + ';' )
    

    return (os.linesep + os.linesep.join( lines )  if  lines  else  '')

def scalar_expected_output_init_c_code( info ):

    x = info[ ASMJS_TEST_OUTPUT ][ 0 ]
    x_type = info[ TYPED_IN_VAR ][ x[ NAME ] ]
    
    return x_type + ' ' + PREFIX_EXPECTED_OUTPUT + x[ NAME ] + ' = ' + format_value( x[ VALUE ], x_type )

def call_once_c_code( info ):

    return (
        ((PREFIX_OUTPUT + info[ TYPED_OUT_VARNAME ])  if  info[ HAS_SIMPLE_OUTPUT ]  else  '') + 
        info[ NAME ] + '( ' + ', '.join( 
            ([ ARRAY_NAME, ]  if  info[ HAS_ARRAY]  else  []) + 
            info[ SIMPLE_IN_VARARR ]
            ) + ' );'
        )

def unit_test_output_c_code( info ):

    lines = []

    if info[ HAS_SIMPLE_OUTPUT ]:
        pass  # xxx

    else:
        pass  # xxx

    return os.linesep.join( lines )  or  ''

def comment_c_code( s ):
    return '/* ' + s + ' */'

def format_value( v, t ):

    if t == 'int' or isinstance( v, int ):
        return str( v )

    if t == 'float':
        return '{0:.16}'.format( v )   # xxx check .16

    if t == 'double':
        return '{0:.32}'.format( v )   # xxx check .32


if __name__ == '__main__':
    test_c( verbose=True )
