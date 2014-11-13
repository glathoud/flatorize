#!/usr/bin/env python3

import glob, json, os, re, shutil, subprocess

ARRAY_COUNT       = 'array_count'
ARRAY_NAME2INFO   = 'array_name2info'
ARRAY_TYPE        = 'array_type'

ASMJS_TEST_INPUT  = 'asmjs_test_input'
ASMJS_TEST_OUTPUT = 'asmjs_test_output'

BEGIN = 'begin'

ENCODING  = 'utf-8'
END       = 'end'

FUN_DECL_CODE = 'funDeclCode'

HAS_ARRAY = 'has_array'
HAS_SIMPLE_OUTPUT = 'has_simple_output'

IS_INPUT  = 'is_input'
IS_OUTPUT = 'is_output'

MESSAGE   = 'message'

N_FAILURE = 'n_failure'
N_SUCCESS = 'n_success'
N         = 'n'

NAME = 'name'

OK   = 'ok'

SIMPLE_IN_VARARR = 'simple_in_vararr'

TESTDIR        = 'test'
TESTDIR_RX_STR = r'\/(' + TESTDIR + '\/?)?$'

TYPED_IN_VAR = 'typed_in_var'

TYPED_OUT_VARNAME = 'typed_out_varname'
TYPED_OUT_VARTYPE = 'typed_out_vartype'

VALUE = 'value'

def d8_call( jscode ):

    wd = os.getcwd()
    
    js_wd = re.sub( TESTDIR_RX_STR, '', wd )
    
    os.chdir( js_wd )
    outstr = subprocess.check_output( 'd8 -e "' + jscode + '"', shell=True, stderr=subprocess.STDOUT, universal_newlines = True )
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


def get_array_test_sorted( info, expected_output_alone = False ):

    n2i = info[ ARRAY_NAME2INFO ]

    ti = info[ ASMJS_TEST_INPUT ]
    to = info[ ASMJS_TEST_OUTPUT ]
    
    arr = to  if  expected_output_alone  else  (ti + to)
    arr.sort( key = lambda x: n2i[ x[ NAME ] ][ BEGIN ] )

    arr = list( map( lambda x: dict( list( x.items() ) + list( n2i[ x[ NAME ] ].items() ) ), arr ) )

    return arr

def get_test_dirname( somename ):

    wd = os.getcwd()
    
    js_wd = re.sub( TESTDIR_RX_STR, '', wd )

    return os.path.join( js_wd, TESTDIR, somename )

def summary( str_or_arr ):

    try:
        arr = json.loads( str_or_arr)  if  isinstance( str_or_arr, str )  else  str_or_arr
        n         = len( arr )
        n_success = sum( 1 if x[ OK ] else 0 for x in arr )
        n_failure = n - n_success
        return { N : n, N_SUCCESS : n_success, N_FAILURE : n_failure, MESSAGE : '{0} success(es), {1} failure(s)'.format( n_success, n_failure ) }

    except e:
        return { N : 1, N_SUCCESS : 0, N_FAILURE : 1, MESSAGE : 'TOTAL FAILURE: ' + str( e ) }

