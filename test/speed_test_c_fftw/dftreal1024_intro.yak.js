[
    { p : 'We measure the speed of various implementations on the DFTREAL1024 use case: compute the first 513 complex numbers of the Discrete Fourier Transform (DFT) of a vector of 1024 real numbers (a 513-long output is enough because of the hermitian symmetry).' }
    , { p : ' To run the speed tests you need to install on your machine:' }
    , { ul : [ 'Python 3', 'The V8 JavaScript engine', 'GCC', 'clang' ].map( yak.f( '{li:v+"."}') ) }
    , { p : 'and then run in your command line:' }
    , { pre : { 'code class="prettyprint lang-python"' : './dftreal1024.py <environment_name>' } }

    , { p : 'which:' }
    , { ul : [
        { li : 'runs one speed test for each implementation, ' } 
        , { li : [ 'writes the complete results into the file '
                   , { code : './dftreal1024.results/<environment_name>.json' }, ',' ] }
        , { li : [ ' and updates the list file ', { code : './dftreal1024.results.list.json' }, '.' ] }
    ] }

    , { p : [ { code : '<environment_name>' }, ' should loosely describe your CPU, machine and operating system, e.g. I used "i5_t420s_ubuntu14.04" for an Intel i5 CPU in a Thinkpad T420s with the Ubuntu 14.04 operating system.' ] }
    

    , { h3 : 'The various implementations are:' }

    , { ul : yak.readeval( 'dftreal1024_impl_desc.array.js' ).map( function ( x, i ) {

        return { li : [
        
            { code : x.name }
            , ': '
            , { ul : [
                { li : [ (i < 1  ?  'Algorithm: '  :  ''), x.algorithm ] }
                , { li : [ (i < 1  ?  'Language: '  :  ''), x.language ] }
                , { li : [ (i < 1  ?  'Support: '  :  ''),  x.support ] }
                , { li : (i < 1  ?  [ 'Description: ' ]  :  []).concat( x.description ) }
            ]}

        ] };
    }) }
]
