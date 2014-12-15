#!/usr/bin/env python3

import glob, json, math, os, re, shutil, subprocess, sys

ARRAY_COUNT       = 'array_count'
ARRAY_NAME2INFO   = 'array_name2info'
ARRAY_TYPE        = 'array_type'

ASMJS_TEST_INPUT  = 'asmjs_test_input'
ASMJS_TEST_OUTPUT = 'asmjs_test_output'

BEGIN = 'begin'

DURATION_SEC = 'duration_sec'

ENCODING  = 'utf-8'
END       = 'end'

FUN_DECL_CODE = 'funDeclCode'

HAS_ARRAY = 'has_array'
HAS_SIMPLE_OUTPUT = 'has_simple_output'

IS_INPUT  = 'is_input'
IS_OUTPUT = 'is_output'

ITER_PER_SEC = 'iter_per_sec'

MESSAGE   = 'message'
META      = 'meta'

N_FAILURE = 'n_failure'
N_SUCCESS = 'n_success'
N         = 'n'

NAME = 'name'

OK   = 'ok'

RESULT = 'result'

SIMPLE_ERROR = 'error'
SIMPLE_IN_VARARR = 'simple_in_vararr'

SYSTEM = 'system'

TESTDIR        = 'test'
TESTDIR_RX_STR = r'\/(' + TESTDIR + '(\/.*)?)?$'

TYPED_IN_VAR = 'typed_in_var'

TYPED_OUT_VARNAME = 'typed_out_varname'
TYPED_OUT_VARTYPE = 'typed_out_vartype'

VALUE = 'value'

V8_SPEED = 'v8_speed';

def d8_call( jscode ):

    jscode = re.sub( r'[\r\n]', ' ', jscode )

    wd = os.getcwd()
    
    js_wd = re.sub( TESTDIR_RX_STR, '', wd )
    
    os.chdir( js_wd )
    try:
        outstr = subprocess.check_output( 'd8 -e "' + jscode + '"', shell=True, stderr=subprocess.STDOUT, universal_newlines = True )
    except Exception as e:
        print(e.output)
        raise e
        
    
    os.chdir( wd )
    
    return outstr


def ensure_dir( dirname, empty = False ):

    if os.path.exists( dirname ): 

        if not os.path.isdir( dirname ):
            None.error__must_be_a_directory

        if empty and glob.glob( os.path.join( dirname, '*' ) ):
            shutil.rmtree( dirname )

    if not os.path.exists( dirname ):
        os.makedirs( dirname )


def extless_from( filename ):
    return os.path.splitext( filename )[ 0 ]

def get_array_test_sorted( info, expected_output_alone = False, one_name = None ):

    n2i = info[ ARRAY_NAME2INFO ]

    ti = info[ ASMJS_TEST_INPUT ]
    to = info[ ASMJS_TEST_OUTPUT ]
    
    arr = to  if  expected_output_alone  else  (ti + to)

    if one_name:
        arr = list( filter( lambda x: x[ NAME ] == one_name, arr ) )
    
    arr.sort( key = lambda x: n2i[ x[ NAME ] ][ BEGIN ] )


    arr = list( map( lambda x: dict( list( x.items() ) + list( n2i[ x[ NAME ] ].items() ) ), arr ) )

    return arr

def get_test_dirname( somename ):

    wd = os.getcwd()
    
    js_wd = re.sub( TESTDIR_RX_STR, '', wd )

    return os.path.join( js_wd, TESTDIR, somename )


def meta( situation ):
    
    ret = {
        SYSTEM : sh_call( 'uname -a', local=False )
        }
    
    if situation == 'v8':
        ret[ situation ] = d8_call( 'print(version())' ).strip()
    elif situation == 'gcc' or situation == 'clang':
        ret[ situation ] = sh_call( situation + ' --version', local=False ).strip()
    else:
        raise Exception( 'meta: unrecognized situation "{0}"'.format( situation ) )

    return ret

def meta_v8():
    return meta( 'v8' )

def meta_gcc():
    return meta( 'gcc' )

def meta_clang():
    return meta( 'clang' )


def pathless_from( filename ):
    return os.path.split( filename )[ 1 ]

def sh_call( filename, local=True ):

    wd = os.getcwd()

    path,name = os.path.split( os.path.abspath( filename ) )
    
    os.chdir( path )
    outstr = subprocess.check_output( ('./' if local else '') + name, shell=True, stderr=subprocess.STDOUT, universal_newlines = True )
    os.chdir( wd )
    
    return outstr


def sh_speed_test( filename, min_duration_sec = 1.0, verbose_prefix = None):

    n = 1
    while True:
        bin_out = sh_call( '{0} {1}'.format( filename, n ) )
        last_line = list( filter( lambda s: s, map( lambda s: s.strip(), bin_out.split( os.linesep ) ) ) )[ -1 ]
        duration_sec = float( last_line )
        assert not math.isnan( duration_sec )

        if 1.0 < duration_sec:
            break
        else:
            n = n << 1
        
    iter_per_sec = n / duration_sec

    ret = { ITER_PER_SEC : iter_per_sec, N : n, DURATION_SEC : duration_sec, }

    if isinstance( verbose_prefix, str ):
        print( verbose_prefix + ('{' + ITER_PER_SEC + '} iterations/second = {' + N + '} iterations / {' + DURATION_SEC + '} seconds').format( **ret ) )
    
    return ret


def summary( str_or_arr ):

    try:
        arr = json.loads( str_or_arr)  if  isinstance( str_or_arr, str )  else  str_or_arr
        n         = len( arr )
        n_success = sum( 1 if x[ OK ] else 0 for x in arr )
        n_failure = n - n_success
        return { N : n, N_SUCCESS : n_success, N_FAILURE : n_failure, MESSAGE : '{0} success(es), {1} failure(s)'.format( n_success, n_failure ) }

    except e:
        return { N : 1, N_SUCCESS : 0, N_FAILURE : 1, MESSAGE : 'TOTAL FAILURE: ' + str( e ) }

