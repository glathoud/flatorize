#!/usr/bin/env python3

import json, os

from common import *

from test_asmjs import test_asmjs
from test_c     import test_c

def main( verbose = True ):

    result_li = []

    if verbose: print( os.linesep + '.' )
    result_li.extend( test_asmjs( verbose = verbose ) )

    if verbose: print( os.linesep + '.' )
    result_li.extend( test_c( verbose = verbose ) )
    

    s = summary( result_li )
    
    if verbose: 
        print( os.linesep + '.' )
        print()
        print( '--- all done ---' )
        print( s[ MESSAGE ] )

    if s[ N_FAILURE ] > 0:
        if verbose: print( 'Failure(s):' )
        faili = filter( lambda x: not x[ OK ], result_li )
        if verbose: print( os.linesep.join( map( json.dumps, faili ) ) )

    return s

if __name__ == '__main__':
    main()
