#!/usr/bin/env python3

import json, math, os, pprint, re, stat, sys, time, traceback

from common import *

ARRAY_NAME = 'io_array'

CUSTOM_INIT_C_CODE = 'custom_init_c_code'

INDENT = '  '

PREFIX_INPUT           = 'input_'
PREFIX_INPUT_DATA      = PREFIX_INPUT + 'data_'
PREFIX_OUTPUT          = 'output_'
PREFIX_EXPECTED_OUTPUT = 'expected_' + PREFIX_OUTPUT

SRCDIR = 'test_c.srcdir'
OUTDIR = 'test_c.outdir'

STRUCT_NAME_TYPE     = 'STRUCT_NAME'
STRUCT_NAME_INSTANCE = 'struct_name'

def copy_src( srcdir, outdir, verbose_prefix=None ):

    for filename in glob.glob( os.path.join( srcdir, '*.[hc]' )):
        h,t = os.path.split( filename )
        copyname = os.path.join( outdir, t )
        assert filename != copyname, 'must differ'
        shutil.copyfile( filename, copyname )
        if isinstance( verbose_prefix, str ):
            print( verbose_prefix + ('copied src file to: "{0}"'.format( copyname )) )


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

    copy_src( srcdir, outdir, verbose_prefix = verbose and (INDENT + 'test_c: 0. ') )

    #

    if verbose:
        print()
        print( INDENT + 'test_c: 1. pass all asm.js tests, 2. get their configuration and generate C code...' )

    jscode = ' '.join( [ 'load(\'asmjs/tests.js\');'

                         , 'var passed;'
                         , 'for (var name in passed) if (!passed[ name ]) throw new Error(\'Not all asm.js test passed: failed on at least: \' + name + \'.\');'

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
    

    if verbose:
        print( os.linesep.join(sorted(infomap.keys()) ))
        print()
        print( INDENT + 'test:c: 3. write out .h, .c and .sh files for each example...' )

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

    special_test_scalarint_from_scalardouble_forbidden( out_arr, verbose = verbose )

    if verbose:
        print()
        print( '...done with `test_c`: {0}'.format( summary( out_arr )[ MESSAGE ] ) )

    return out_arr

def assert_test( name, info, outdir, verbose ):

    if verbose:
        print()
        print( INDENT * 2 + name )

    filename_base     = os.path.join( outdir, name )
    filename_h        = filename_base + '.h'
    filename_c        = filename_base + '.c'
    filename_test_c   = filename_base + '_test.c'

    extless = os.path.splitext( filename_test_c )[ 0 ]

    filename_test_gcc32_sh  = extless + '.gcc32.sh'
    filename_test_gcc32_bin = extless + '.gcc32.bin'

    filename_test_gcc64_sh  = extless + '.gcc64.sh'
    filename_test_gcc64_bin = extless + '.gcc64.bin'

    filename_test_clang32_sh  = extless + '.clang32.sh'
    filename_test_clang32_bin = extless + '.clang32.bin'

    filename_test_clang64_sh  = extless + '.clang64.sh'
    filename_test_clang64_bin = extless + '.clang64.bin'

    pathless_test_gcc32_bin = os.path.split( filename_test_gcc32_bin )[ 1 ]
    pathless_test_gcc64_bin = os.path.split( filename_test_gcc64_bin )[ 1 ]
    pathless_test_clang32_bin = os.path.split( filename_test_clang32_bin )[ 1 ]
    pathless_test_clang64_bin = os.path.split( filename_test_clang64_bin )[ 1 ]

    # Generate implementation files (.h and .c)

    if verbose:
        print()
        print( INDENT * 3 + 'Write: ' + filename_h )
    open( filename_h, 'wb' ).write( info[ 'helper_h_dfltcode' ].encode( ENCODING ) )

    if verbose:
        print( INDENT * 3 + 'Write: ' + filename_c )
    open( filename_c, 'wb' ).write( info[ 'helper_c_dfltcode' ].encode( ENCODING ) )

    # Generate unit test file (.c)

    if verbose:
        print( INDENT * 3 + 'Write: ' + filename_test_c )
    open( filename_test_c, 'wb' ).write( test_c_code( info, filename_h ).encode( ENCODING ) )

    # Generate compiler script (.sh)

    for fn_sh,clang in ( (filename_test_sh,False,), (filename_test_clang_sh,True,),):
        for bits64 in (False,True,):
            if verbose:
                print()
                print( INDENT * 3 + 'Write: ' + fn_sh )
            open( fn_sh, 'wb' ).write(
                test_compile_sh_code( 
                    info, filename_h, filename_c, filename_test_c, clang = clang, bits64 = bits64 
                    ).encode( ENCODING ) 
                )
            os.chmod( fn_sh, stat.S_IRWXU )

    # Call compiler script

    ret = {}

    for clang in (False,True,):

        compilname = 'clang' if clang else 'gcc'
        
        for bits64 in (False,True,):

            bitsname = '64' if bits64 else '32'

            cbname = compilname + bitsname

            if verbose:
                print()
                print( 
                    INDENT * 3 + 'Call "compiler script" == compile + unit test + speed test (' + cbname +')'
                    )
                sys.stdout.flush()
            
            compile_start = time.time()

            if clang:
                if bits64:
                    fn_test_sh  = filename_test_clang64_sh
                    fn_test_bin = filename_test_clang64_bin
                else:
                    fn_test_sh  = filename_test_clang32_sh
                    fn_test_bin = filename_test_clang32_bin
            else:
                if bits64:
                    fn_test_sh  = filename_test_gcc64_sh
                    fn_test_bin = filename_test_gcc64_bin
                else:
                    fn_test_sh  = filename_test_gcc32_sh
                    fn_test_bin = filename_test_gcc32_bin

            call_sh_assert_ok( fn_test_sh, fn_test_bin, verbose = verbose )

            compile_duration_sec = time.time() - compile_start
            
            if verbose:
                print( 'done in {0:.3} seconds'.format( compile_duration_sec ) )
        
            ret[ 'compile_' + cbname + '_duration_sec' ] = compile_duration_sec

    return ret

def call_sh_assert_ok( filename_test_sh, filename_test_bin, verbose=True ):

    wd = os.getcwd()

    sh_path = os.path.split( filename_test_sh )[ 0 ]
    os.chdir( sh_path )

    pathless_test_sh  = pathless_from( filename_test_sh )
    pathless_test_bin = pathless_from( filename_test_bin )
    
    sh_start = time.time()
    sh_out = sh_call( pathless_test_sh )
    sh_duration_sec = time.time() - sh_start

    line_must_be_ok = False
    line_must_be_a_number = False

    unit_test_ok = False
    speed_test_ok = False

    for line in sh_out.split( os.linesep ):

        line = line.strip()

        if line.endswith( pathless_test_bin ):
            line_must_be_ok = True
            continue

        if line_must_be_ok:
            tmp = line == 'ok'
            if not tmp  and verbose:
                print()
                print( INDENT * 4 + '-> error: ' + line )
            assert tmp
            line_must_be_ok = False
            unit_test_ok = True
            if verbose:
                print( INDENT * 4 + '- unit test:  ok' )
            continue

        arr = line.split( ' ' )
        if len( arr ) == 2  and  arr[ 0 ].endswith( pathless_test_bin ):
            ns = arr[ 1 ]
            n  = int( ns )
            assert not math.isnan( n )
            assert str( n ) == ns
            line_must_be_a_number = True
            continue

        if line_must_be_a_number:
            number = float( line )
            assert not math.isnan( number )
            line_must_be_a_number = False
            speed_test_ok = True
            if verbose:
                print( INDENT * 4 + '- speed test: ok' )
            continue


    assert unit_test_ok
    assert speed_test_ok


    if verbose:
        print( INDENT * 3 + 'Call .bin directly to be sure' )
    
    bin_out_unit = sh_call( pathless_test_bin )
    assert 'ok' == bin_out_unit.strip()
    if verbose:
        print( INDENT * 4 + '- unit test:  ok' )

    bin_out_speed = sh_call( pathless_test_bin + ' 3' )
    number = float( bin_out_speed.strip() )
    assert not math.isnan( number )
    if verbose:
        print( INDENT * 4 + '- speed test: ok' )
    
    os.chdir( wd )

    return sh_duration_sec

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
#include <string.h>
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

  ''' + simple_input_init_c_code( info ) + (
      '' if not info[ HAS_ARRAY ] else os.linesep.join( map( lambda s: INDENT + s, infostruct_init_c_code( info )))
      ) + (
      (os.linesep + info[ CUSTOM_INIT_C_CODE ])  if  CUSTOM_INIT_C_CODE in info  else ('''

  ''' + comment_c_code( '--- Expected output ---' ) + '''
          
  const ''' +(scalar_expected_output_init_c_code( info )  if  not array_expected_output_name( info )  else  (array_type + ' ' + array_expected_output_name( info ) + '[] = { ' + os.linesep + arrayinit_c_code( info, expected_output_alone = True )) + os.linesep + INDENT + '};')) + '''


  /* --- Unit test (mandatory) --- */

  ''' + call_once_c_code( info ) + '''
  
  ''' + unit_test_output_c_code( info )
          ) + '''


  /* --- Speed test (optional) --- */

  if (n_iter_speed > 0)
  {
    TEST_DURATION_BEGIN;
  
    int i;
    for (i = n_iter_speed ; i-- ; )
    {
      ''' + call_once_c_code( info ) + '''
    }
 
    TEST_DURATION_END;
  }
  else
  {
    printf( "ok\\n" );
  }
  

''' + ('' if not info[ HAS_ARRAY ] else os.linesep.join( map( lambda s: INDENT + s, infostruct_done_c_code( info )))) + '''

  return 0;
}
'''

def array_expected_output_name( info ):

    if info[ HAS_ARRAY ] and not (CUSTOM_INIT_C_CODE in info):

        tmp = info[ ASMJS_TEST_OUTPUT ][ 0 ][ NAME ] 

        if tmp in info[ ARRAY_NAME2INFO ]:
            return PREFIX_EXPECTED_OUTPUT + tmp
    


def arrayinit_c_code( info, expected_output_alone = False, one_name = None ):
    
    assert info[ HAS_ARRAY ]

    array_type = info[ ARRAY_TYPE ]
    
    array_test_sorted = get_array_test_sorted( info, expected_output_alone = expected_output_alone, one_name = one_name )

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



    single = expected_output_alone  or  one_name

    i = array_test_sorted[ 0 ][ BEGIN ]  if  single  else  0
    for x in array_test_sorted:

        begin = x[ BEGIN ]

        s = []
        while i < begin:
            s.append( '0, ' )
            i += 1
        if s:
            lines.append( ''.join( s ) )

        indent_n_start = 2

        is_output = x[ IS_OUTPUT ]

        lines.append( '' )

        if is_output and not single:
            lines.append( comment_c_code( ( 'output'  if  is_output  else  'input' ) + ' array "' + x[ NAME ] + '"' + ( ' (initialization to 0)'  if  (is_output and not single)  else  '') ) )
            lines.append( '' )

        push_array_recursive( x[ VALUE ], indent_n = indent_n_start, is_output = is_output )
        lines.append( '' )
        
        i = x[ END ]
        

    if not single:
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

    if CUSTOM_INIT_C_CODE not in info:
        for x in info[ ASMJS_TEST_INPUT ]:
            x_type = info[ TYPED_IN_VAR ][ x[ NAME ]]
            if isinstance( x_type, str ):
                lines.append( 'const ' + x_type + ' ' + PREFIX_INPUT + x[ NAME ] + ' = ' + format_value( x[ VALUE ], x_type ) + ';' )   

    return (os.linesep + os.linesep.join( lines )  if  lines  else  '')


def infostruct_init_c_code( info ):

    assert info[ HAS_ARRAY ]

    ret = []
        
    a_n2i = info[ ARRAY_NAME2INFO ]
    array_type = info[ ARRAY_TYPE ]

    if CUSTOM_INIT_C_CODE not in info:
        for x in info[ ASMJS_TEST_INPUT ]:
            name = x[ NAME ]
            if name in a_n2i:
                ret.append( '' )
                ret.append( 'const ' + array_type + ' ' + PREFIX_INPUT_DATA + name + '[] = {' )
                ret.append( arrayinit_c_code( info, expected_output_alone = False, one_name = name ) )
                ret.append( '};' )


    ret.extend( [
            '',
            '',
            info[ STRUCT_NAME_TYPE ] + '* ' + info[ STRUCT_NAME_INSTANCE ] + ' = ' + info[ NAME ] + '_malloc();',
            '', 
            info[ ARRAY_TYPE ] + '* ' + ARRAY_NAME + ' = ' + info[ STRUCT_NAME_INSTANCE ] + '->' + ARRAY_NAME + ';',
            '',
            ] )

    if CUSTOM_INIT_C_CODE not in info:
        for x in info[ ASMJS_TEST_INPUT ]:
            name = x[ NAME ]
            if name in a_n2i:
                ret.append( 'memcpy( ' + info[ STRUCT_NAME_INSTANCE ] + '->' + name + ', ' + PREFIX_INPUT_DATA + name + ', ' + info[ STRUCT_NAME_INSTANCE ] + '->' + name.upper() + '_NBYTES );' )

    return ret

def infostruct_done_c_code( info ):

    assert info[ HAS_ARRAY ]

    return [
        info[ NAME ] + '_free( ' + info[ STRUCT_NAME_INSTANCE ]+ ' );',
        ]

def scalar_expected_output_init_c_code( info ):

    x = info[ ASMJS_TEST_OUTPUT ][ 0 ]
    x_type = info[ TYPED_OUT_VARTYPE ]
    
    return x_type + ' ' + PREFIX_EXPECTED_OUTPUT + x[ NAME ] + ' = ' + format_value( x[ VALUE ], x_type ) + ';'

def call_once_c_code( info ):

    return (
        ((info[ TYPED_OUT_VARTYPE ] + ' ' + PREFIX_OUTPUT + info[ TYPED_OUT_VARNAME ] + ' = ')  if  info[ HAS_SIMPLE_OUTPUT ]  else  '') + 
        info[ NAME ] + '( ' + ', '.join( 
            [ PREFIX_INPUT + s  for s in info[ SIMPLE_IN_VARARR ] ] + 
            ([ ARRAY_NAME, ]  if  info[ HAS_ARRAY]  else  [])
            ) + ' );'
        )

def unit_test_output_c_code( info ):

    lines = []

    x  = info[ ASMJS_TEST_OUTPUT ][ 0 ]

    o_name = info[ TYPED_OUT_VARNAME ]

    if info[ HAS_SIMPLE_OUTPUT ]:

        one_expected = PREFIX_EXPECTED_OUTPUT + o_name
        one_out      = PREFIX_OUTPUT + o_name    

        o_type = info[ TYPED_OUT_VARTYPE ]

        lines.append( o_type + ' ' + SIMPLE_ERROR + ' = fabs( ' + one_expected + ' - ' + one_out + ' );'  )
        lines.append( 'if (' + SIMPLE_ERROR + ' > EPSILON) { fprintf( stderr, "Wrong output: %g, expected: %g, error: %g\\n", ' + one_out + ', ' + one_expected + ', ' + SIMPLE_ERROR + ' ); return -1; }')
        

    else:

        xi = info[ ARRAY_NAME2INFO ][ x[ NAME ] ]

        one_expected = PREFIX_EXPECTED_OUTPUT + o_name
        one_out      = info[ STRUCT_NAME_INSTANCE ] + '->' + info[ TYPED_OUT_VARNAME ]

        o_type = info[ ARRAY_TYPE ]

        lines.append( INDENT + 'int i;' )
        lines.append( INDENT + 'for (i = ' + str( xi[ N ] ) + '; i--;)' )
        lines.append( INDENT + '{' )
        lines.append( INDENT * 2 + o_type + ' ' + SIMPLE_ERROR + ' = fabs( ' + one_expected + '[i] - ' + one_out + '[i] );' )
        lines.append( INDENT * 2 + 'if (' + SIMPLE_ERROR + ' > EPSILON)' )
        lines.append( INDENT * 2 + '{' )
        lines.append( INDENT * 3 + 'fprintf( stderr, "Wrong output[%d]: %g, expected[%d]: %g, error: %g\\n", i, ' + one_out + '[i], i, ' + one_expected + '[i], ' + SIMPLE_ERROR + ' );' )
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



def test_compile_sh_code( info, filename_h, filename_c, filename_test_c, clang=False, bits64=True ):

    bits = '64' if bits64 else '32'

    dot  = ( '.clang' if clang else '.gcc' ) + bits + '.'

    common_o = 'common' + dot + 'o'

    filename_s = os.path.splitext( filename_c )[ 0 ] + dot + 's'
    filename_o = os.path.splitext( filename_c )[ 0 ] + dot + 'o'

    filename_test_bin = os.path.splitext( filename_test_c )[ 0 ] + dot + 'bin'

    filename_test_bin_tail = os.path.split( filename_test_bin )[ 1 ]

    compilo = ('clang' if clang else 'gcc -malign-double') + ' -m' + bits


    return '''#!/usr/bin/env sh

set -v
#
# Compiling
# The same optimization flags as used by in FFTW3.3.3
#
''' + compilo + ''' -O3 -fomit-frame-pointer -mtune=native -fstrict-aliasing -fno-schedule-insns -ffast-math     -c -o ''' + common_o + '''    common.c   -lm
#
#
''' + compilo + ''' -O3 -fomit-frame-pointer -mtune=native -fstrict-aliasing -fno-schedule-insns -ffast-math     -c -o ''' + filename_o + '''    ''' + filename_c + '''   -lm
#
''' + compilo + ''' -lrt -o ''' + filename_test_bin + '    ' + common_o + ' ' + filename_o + ' ' + filename_test_c + '''  -lm
#
# Unit test
#
./''' + filename_test_bin_tail + '''
#
# Speed test
./''' + filename_test_bin_tail + ''' 3
#
set +v
'''


def special_test_scalarint_from_scalardouble_forbidden( out_arr, verbose = True ):

    jscode = '''load('flatorize.js'); load('flatorize_c.js');

        var plusone_name = 'plusone'
    ,   plusone = flatorize(
        /* note the :[type] declarations, ignored by flatorize */
        /* but useful later in asm.js or C contexts */
        'a:double->b:int'
        , function (a)
        {
            return flatorize.expr( a, '+', 1.1 );
        }
    )
    ;

    try {
        var plusone_asmjs_name = plusone_name + '_asmjs'
        , plusone_asmjs_gen    = flatorize.getCodeC( { switcher : plusone, name : plusone_asmjs_name } )
        ;
    } catch (e) {
     
        if (!(-1 < ('' + e).indexOf( 'Only one basic type permitted' )))
            throw e;

        print('ok');
    }
'''

    outstr = d8_call( jscode )

    is_ok = 'ok' == outstr.strip()
    name  = 'scalarint_from_scalardouble'

    out_arr.append( { OK : is_ok, NAME : name } )

    if verbose:
        print()
        print( INDENT * 2 + 'special test: ' + name + ' must be forbidden, an error must be thrown -> result: ' + ('success' if is_ok else 'failure'))

    return is_ok

if __name__ == '__main__':
    test_c( verbose=True )
