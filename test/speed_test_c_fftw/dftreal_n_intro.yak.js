/* -*- coding: utf-8 -*- */
function ( dftsize ) {
    
    var hermihalf_size = 1 + (dftsize >> 1);

    return [

        { 'h3 id="all-speed-tests"' : 'Convenience: run speed tests for all sizes' }

        , { p : 'A wrapper runs speed tests for all sizes 16, 32, 64, 128, 256, 512, 1024:' }

        , { pre : { 'code class="prettyprint lang-python"' : './dftreal0_all.sh <environment_name>' }}

        , { p : [ { code : '<environment_name>' }, ' should loosely describe your CPU, machine and operating system, e.g. I used "i5_t420s_ubuntu14.04" for an Intel i5 CPU in a Thinkpad T420s with the Ubuntu 14.04 operating system.' ] }

        , { 'h3 id="speed-tests"' : 'The speed tests for size ' + dftsize }
        , { p : 'We measure the speed of various implementations of the DFTREAL1024 task: compute the first 513 complex numbers of the Discrete Fourier Transform (DFT) of a vector of ' + dftsize + ' real numbers (a ' + hermihalf_size + '-long output is enough because of the hermitian symmetry on real signals).' }
        , { p : ' To run the speed tests you need to install on your machine:' }
        , { ul : [ 'Python 3', 'The V8 JavaScript engine', 'Two compilers for the C language: GCC, clang', 'Three compilers for the D language: DMD, GDC, LDC2' ].map( yak.f( '{li:v+"."}') ) }
        , { p : 'and then run in your command line:' }
        , { pre : { 'code class="prettyprint lang-python"' : './dftreal0_speed_test.py ' + dftsize + ' <environment_name>' } }

        , { p : 'which:' }
        , { ul : [
            { li : 'runs one speed test for each implementation and each compiler/interpreter, ' } 
            , { li : [ 'writes the complete results into the file '
                       , { code : './dftreal' + dftsize + '.results/<environment_name>.json' }, ',' ] }
            , { li : [ ' and updates the list file ', { code : './dftreal' + dftsize + '.results.list.json' }, '.' ] }
        ] }

        , { p : [ { code : '<environment_name>' }, ' should loosely describe your CPU, machine and operating system, e.g. I used "i5_t420s_ubuntu14.04" for an Intel i5 CPU in a Thinkpad T420s with the Ubuntu 14.04 operating system.' ] }
        

        , { 'h3 id="impl"' : 'The various implementations' }

        , { ul : yak.readeval( 'dftreal_n_impl_desc.array.js' ).map( function ( x, i ) {

            var blah = true;
            
            return { li : [
                
                { code : x.name }
                , ': '
                , { dl : [ 'algorithm', 'language', 'support', 'description' ].map( one_topic ) }
            ] };

            function one_topic( topic )
            {
                return (blah  ?  [ { dt : [ { em : topic } ] } ]  :  []).concat( { dd : x[ topic ] } );
            }

        }) }
    ];
}
