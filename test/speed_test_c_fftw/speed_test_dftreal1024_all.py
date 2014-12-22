#!/usr/bin/env python3

import glob, importlib, os, pprint

def speed_test_dftreal1024_all( verbose_level = 1 ):

    verbose          = verbose_level > 0
    verbose_detailed = verbose_level > 1

    ret = {}

    me = os.path.split( __file__ )[ 1 ]

    filename_li = list( filter( lambda s: s != me,
                                glob.glob( 'speed_test_dftreal1024_*.py' )
                            )
                    )
    
    filename_li.sort()

    for filename in filename_li:

        if verbose:
            print()
            print('[ {0} ]'.format( filename ))

        name   = os.path.splitext( filename )[ 0 ]
        module = importlib.import_module( name )
        impl   = getattr( module, name )

        ret.update( impl( verbose = verbose_detailed ) )



    
    if verbose:
        print()
        print('[ --- all done --- ]')
        print()
        pprint.pprint( ret )

    return ret
    

if __name__ == '__main__':
    speed_test_dftreal1024_all()
