#!/usr/bin/env python3

import json

from common import *

def test_asmjs( verbose=True ):
    
    if verbose:
        print( '' )
        print( 'Running `test_asmjs`...')

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
                         , 'out.sort( function (a,b) { return a[ \'' + NAME + '\' ] < b[ \'' + NAME + '\' ]  ?  -1  :  +1; } );'
                         , 'print( JSON.stringify( out ) );'
                         ]
                       )

    outstr = d8_call( jscode )
    
    if verbose:
        print( '...done with `test_asmjs`: {0}'.format( summary( outstr )[ MESSAGE ] ) )

    if outstr:
        return list( json.loads( outstr ) )
    
    return ( { OK : False, NAME : 'asmjs.py call to V8 failed somewhere.' }, )


if __name__ == '__main__':
    test_asmjs( verbose=True )
