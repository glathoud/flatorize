#!/usr/bin/env python3

import json, os, re, subprocess

MESSAGE   = 'message'

N_FAILURE = 'n_failure'
N_SUCCESS = 'n_success'
N         = 'n'

NAME = 'name'

OK   = 'ok'



def d8_call( jscode ):

    wd = os.getcwd()
    
    js_wd = re.sub( r'\/(test\/?)?$', '', wd )
    
    os.chdir( js_wd )
    outstr = subprocess.check_output( 'd8 -e "' + jscode + '"', shell=True, stderr=subprocess.STDOUT, universal_newlines = True )
    os.chdir( wd )
    
    return outstr


def summary( str_or_arr ):

    try:
        arr = json.loads( str_or_arr)  if  isinstance( str_or_arr, str )  else  str_or_arr
        n         = len( arr )
        n_success = sum( 1 if x[ OK ] else 0 for x in arr )
        n_failure = n - n_success
        return { N : n, N_SUCCESS : n_success, N_FAILURE : n_failure, MESSAGE : '{0} success(es), {1} failure(s)'.format( n_success, n_failure ) }

    except e:
        return { N : 1, N_SUCCESS : 0, N_FAILURE : 1, MESSAGE : 'TOTAL FAILURE: ' + str( e ) }

