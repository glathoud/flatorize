#!/usr/bin/env python3

import json, os

from common import *

from test_asmjs import test_asmjs
from test_c     import test_c

def main( verbose = True ):

    result_li = test_asmjs( verbose = verbose ) # xxx work in progress: + test_c( verbose = verbose )

    s = summary( result_li )
    
    print()
    print( '--- all done ---' )
    print( s[ MESSAGE ] )

    if s[ N_FAILURE ] > 0:
        print( 'Failure(s):' )
        faili = filter( lambda x: not x[ OK ], result_li )
        print( os.linesep.join( map( json.dumps, faili ) ) )

if __name__ == '__main__':
    main()
