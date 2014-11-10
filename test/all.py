#!/usr/bin/env python3

import json, os

from common import *

from asmjs import test_asmjs

def main( verbose=True ):

    result_li = test_asmjs( verbose=verbose )

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
