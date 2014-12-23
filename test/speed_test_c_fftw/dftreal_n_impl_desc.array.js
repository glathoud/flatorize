[
    { name : 'naive_v8'
      , algorithm : [ 'MSR (', { 'a href="fft-newsplit-2007-johnson-frigo.pdf"' : 'Modified Split-Radix' }, ')' ]
      , language : 'JavaScript'
      , support : 'V8 engine'
      , description : [
          'Naive JavaScript implementation of MSR. «Naive» means: with many recursive function calls. The test runs on the V8 JavaScript engine.'
      ]
    }

    , { name : 'flatorize_v8'
        , algorithm : 'MSR'
        , language : 'JavaScript'
        , support : 'V8 engine'
        , description : [
            { 'a href="../../index.html"' : 'Flatorized' }, ' JavaScript implementation of ', { code : 'naive_v8' }, '. Flatorization eliminates the many recursive function calls. The test runs on the V8 JavaScript engine.'
        ]
      }

    , { name : 'flatorize_asmjs_v8'
        , algorithm : 'MSR'
        , language : 'JavaScript'
        , support : 'V8 engine'
        , description : [
            { 'a href="../../asmjs.html"' : [ { code : 'asm.js' }, ' variant' ] }, ' of the flatorized JavaScript implementation of ', { code : 'naive_v8' }, '. Flatorization eliminates the many recursive function calls, and the generated code is ', { code : 'asm.js' }, '-compatible, heavily using typed arrays for further speedup. The test runs on the V8 JavaScript engine.'
        ]
      }

    , { name : 'flatorize_c_clang, flatorize_c_gcc'
        , algorithm : 'MSR'
        , language : 'C'
        , support : 'clang, GCC'
        , description : [
            { 'a href="../../c.html"' : [ { code : 'C' }, ' variant' ] }, ' of the flatorized implementation of ', { code : 'naive_v8' }, '. Flatorization eliminates the many recursive function calls, and the generated code looks similar to the ', { code : 'asm.js' }, ' variant. Both clang and GCC are tested.'
        ]
      }

    , { name : 'fftw3real_gcc'
        , algorithm : [ { 'a href="http://www.fftw.org"' : 'FFTW3.3.4' }, ' (MSR + several other local algorithms, dynamically chosen for the given platform)' ]
        , language : 'C'
        , support : 'GCC'
        , description : [
            'State-of-the-art algorithm & implementation of the Discrete Fourier Transform, includes many local, dynamic optimizations (e.g. replace MSR with locally faster algorithms at the deeper levels of recursion). The local optimizations (choice of algorithm) are made dynamically to each platform. FFTW should give a good idea of the fastest achievable speed to date.'
        ]
      }

]
