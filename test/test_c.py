#!/usr/bin/env python3

import json, os, pprint, re, stat

from common import *

ARRAY_NAME = 'io_array'

INDENT = '  '

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
        print( INDENT + 'test_c: 0. setup outdir: ' + outdir )

    ensure_dir( outdir, empty = True )

    for filename in glob.glob( os.path.join( srcdir, '*.[hc]' )):
        h,t = os.path.split( filename )
        copyname = os.path.join( outdir, t )
        assert filename != copyname, 'must differ'
        shutil.copyfile( filename, copyname )
        print( INDENT + 'test_c: 0. copied src file to: "{0}"'.format( copyname ) )

    #

    if verbose:
        print()
        print( INDENT + 'test_c: 1. pass all asm.js tests, 2. get their configuration and generate C code...' )

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

                         , '  var asmjs_info = passed_asmjsgen_info[ name ]'
                         , '  ,   cfg        = Object.create( asmjs_info.cfg )'
                         , '  ;'
                         , '  cfg.helper_h_name = name + \'.h\';'

                         , '  var o = flatorize.getCodeC( cfg );'

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
        print( INDENT + 'test:c: 3. write out .h, .c and .sh files for each example...' )

    for name,info in infomap.items():

        filename_base = os.path.join( outdir, name )
        filename_h    = filename_base + '.h'
        filename_c    = filename_base + '.c'
        filename_test_c  = filename_base + '_test.c'
        filename_test_sh = os.path.splitext( filename_test_c )[ 0 ] + '.sh'

        # Generate implementation files (.h and .c)

        if verbose:
            print()
            print( INDENT * 2 + filename_h )
        open( filename_h, 'wb' ).write( info[ 'helper_h_dfltcode' ].encode( ENCODING ) )

        if verbose:
            print( INDENT * 2 + filename_c )
        open( filename_c, 'wb' ).write( info[ 'helper_c_dfltcode' ].encode( ENCODING ) )

        # Generate unit test file (.c)

        if verbose:
            print( INDENT * 2 + filename_test_c )
        open( filename_test_c, 'wb' ).write( test_c_code( info, filename_h ).encode( ENCODING ) )

        # Generate compiler script (.sh)

        if verbose:
            print( INDENT * 2 + filename_test_sh )
        open( filename_test_sh, 'wb' ).write(
            test_compile_sh_code( info, filename_h, filename_c, filename_test_c ).encode( ENCODING ) 
            )
        os.chmod( filename_test_sh, stat.S_IRWXU )

    assert False, 'xxx_rest_todo'

    if verbose:
        print( '...done with `test_c`: {0}'.format( summary( outstr )[ MESSAGE ] ) )

    if outstr:
        return list( json.loads( outstr ) )
    
    return ( { OK : False, NAME : 'asmjs.py call to V8 failed somewhere.' }, )


def test_c_code( info, filename_h ):

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
    n_iter_speed = (int)(tmp);
  }

  ''' + comment_c_code( '--- Input(s) ---') + '''

  ''' + simple_input_init_c_code( info ) + '''
  ''' + ('' if not info[ HAS_ARRAY ] else (array_type + ' ' + array_name + '[] = { ' + os.linesep + arrayinit_c_code( info ) + os.linesep + INDENT + '};')) + '''

  ''' + comment_c_code( '--- Expected output ---' ) + '''

  const ''' +(scalar_expected_output_init_c_code( info )  if  not array_expected_output_name( info )  else  (array_type + ' ' + array_expected_output_name( info ) + '[] = { ' + os.linesep + arrayinit_c_code( info, expected_output_alone = True )) + os.linesep + INDENT + '};') + '''


  /* --- Unit test (mandatory) --- */

  ''' + call_once_c_code( info ) + '''
  
  ''' + unit_test_output_c_code( info ) + '''


  /* --- Speed test (optional) --- */

  if (n_iter_speed > 0)
  {
    TEST_DURATION_BEGIN;
  
    for (i = n_iter_speed ; i-- ; )
      ''' + call_once_c_code( info ) + '''
  
    TEST_DURATION_END;
  }
  else
  {
    printf( "ok\\n" );
  }
  
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

    def push_array_recursive( v, indent_n = 0, is_output = False ):

        a = INDENT * indent_n

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
        lines.append( INDENT * indent_n_start + comment_c_code( ( 'output'  if  is_output  else  'input' ) + ' array "' + x[ NAME ] + '"' + ( ' (initialization to 0)'  if  (is_output and not expected_output_alone)  else  '') ) )
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

    x  = info[ ASMJS_TEST_OUTPUT ][ 0 ]
    xi = info[ ARRAY_NAME2INFO ][ x[ NAME ] ]

    o_name = info[ TYPED_OUT_VARNAME ]

    if info[ HAS_SIMPLE_OUTPUT ]:

        one_expected = PREFIX_EXPECTED_OUTPUT + o_name
        one_out      = PREFIX_OUTPUT + o_name    

        o_type = info[ TYPED_OUT_VARTYPE ]

        lines.append( o_type + ' ' + SIMPLE_ERROR + ' = fabs( ' + one_expected + ' - ' + one_out + ' );'  )
        lines.append( 'if (' + SIMPLE_ERROR + ' > EPSILON) { fprintf( stderr, "Wrong output: %g, expected: %g, error: %g' + one_out + ', ' + one_expected + ', ' + SIMPLE_ERROR + ' ); return -1; }')
        

    else:

        one_expected = PREFIX_EXPECTED_OUTPUT + o_name
        one_out      = ARRAY_NAME

        o_type = info[ ARRAY_TYPE ]

        lines.append( INDENT + 'int begin = ' + str( xi[ BEGIN ] ) + ';' )
        lines.append( INDENT + 'int end   = ' + str( xi[ END ] ) + ';' )
        lines.append( INDENT + 'int i, j;' )
        lines.append( INDENT + 'for (i = begin, j=0; i < end; i++,j++)' )
        lines.append( INDENT + '{' )
        lines.append( INDENT * 2 + o_type + ' ' + SIMPLE_ERROR + ' = fabs( ' + PREFIX_EXPECTED_OUTPUT + o_name + '[j] - ' + ARRAY_NAME + '[i] );' )
        lines.append( INDENT * 2 + 'if (' + SIMPLE_ERROR + ' > EPSILON)' )
        lines.append( INDENT * 2 + '{' )
        lines.append( INDENT * 3 + 'fprintf( stderr, "Wrong output[%d]: %g, expected[%d]: %g, error: %g", i, ' + one_out + '[i], j, ' + one_expected + '[j], ' + SIMPLE_ERROR + ' );' )
        lines.append( INDENT * 3 + 'return -1;')
        lines.append( INDENT * 2 + '}' )
        lines.append( INDENT + '}' )

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



def test_compile_sh_code( info, filename_h, filename_c, filename_test_c ):

    filename_s = os.path.splitext( filename_c )[ 0 ] + '.s'
    filename_o = os.path.splitext( filename_c )[ 0 ] + '.o'

    filename_test_bin = os.path.splitext( filename_test_c )[ 0 ] + '.bin'

    filename_test_bin_tail = os.path.split( filename_test_bin )[ 1 ]

    return '''#!/usr/bin/env sh

set -v
#
# Compiling
#
# quite long
gcc -g -Wa,-a,-ad=common.s     -O3 -fomit-frame-pointer -mtune=native -malign-double -fstrict-aliasing -fno-schedule-insns -ffast-math   -lrt    -c -o common.o    common.c  # Same optimization flags as used by in FFTW3.3.3  +  -lrt for the time testsw
#
gcc -g -Wa,-a,-ad=''' + filename_s + '''     -O3 -fomit-frame-pointer -mtune=native -malign-double -fstrict-aliasing -fno-schedule-insns -ffast-math   -lrt    -c -o ''' + filename_o + '''    ''' + filename_c + '''  # Same optimization flags as used by in FFTW3.3.3  +  -lrt for the time testsw
#
gcc -lrt -o ''' + filename_test_bin + '    common.o ' + filename_o + ' ' + filename_test_c + '''
#
# Unit test
#
./''' + filename_test_bin_tail + '''
#
# Speed test
./''' + filename_test_bin_tail + ''' 1e5
#
set +v
'''


if __name__ == '__main__':
    test_c( verbose=True )
