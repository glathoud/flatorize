[
    { name : 'naive_v8'
      , algorithm : [ 'MSR (', { 'a href="fft-newsplit-2007-johnson-frigo.pdf"' : 'Modified Split-Radix' }, ')' ]
      , language : 'JavaScript'
      , support : 'Interpreter: V8 engine'
      , description : [
          'Naive JavaScript implementation of MSR. «Naive» means: with many recursive function calls. The test runs on the V8 JavaScript engine.'
      ]
    }

    , { name : 'flatorize_v8'
        , algorithm : [ 'MSR (', { 'a href="fft-newsplit-2007-johnson-frigo.pdf"' : 'Modified Split-Radix' }, ')' ]
        , language : 'JavaScript'
        , support : 'Interpreter: V8 engine'
        , description : [
            { 'a href="../../index.html"' : 'Flatorized' }, ' JavaScript implementation of ', { code : 'naive_v8' }, '. Flatorization eliminates the many recursive function calls. The test runs on the V8 JavaScript engine.'
        ]
      }

    , { name : 'flatorize_asmjs_v8'
        , algorithm : [ 'MSR (', { 'a href="fft-newsplit-2007-johnson-frigo.pdf"' : 'Modified Split-Radix' }, ')' ]
        , language : 'JavaScript'
        , support : 'Interpreter: V8 engine'
        , description : [
            { 'a href="../../asmjs.html"' : [ { code : 'asm.js' }, ' variant' ] }, ' of the flatorized JavaScript implementation of ', { code : 'naive_v8' }, '. Flatorization eliminates the many recursive function calls, and the generated code is ', yak.html( '<code>asm.js</code>&#8209;compatible,' ), ' heavily using typed arrays for further speedup. The test runs on the V8 JavaScript engine.'
        ]
      }

    , { name : 'flatorize_c_clang, flatorize_c_gcc'
        , algorithm : [ 'MSR (', { 'a href="fft-newsplit-2007-johnson-frigo.pdf"' : 'Modified Split-Radix' }, ')' ]
        , language : 'C'
        , support : 'Compilers: clang, GCC'
        , description : [
            { 'a href="../../c.html"' : [ { code : 'C' }, ' variant' ] }, ' of the flatorized implementation of ', { code : 'naive_v8' }, '. Flatorization eliminates the many recursive function calls, and the generated code looks similar to the ', { code : 'asm.js' }, ' variant. The test runs on both clang and GCC compilers.'
        ]
      }

    , { name : 'flatorize_d_dmd, flatorize_d_gdc, flatorize_d_ldc2'
        , algorithm : [ 'MSR (', { 'a href="fft-newsplit-2007-johnson-frigo.pdf"' : 'Modified Split-Radix' }, ')' ]
        , language : 'D'
        , support : 'Compilers: DMD, GDC, LDC2'
        , description : [
            { 'a href="../../d.html"' : [ { code : 'D' }, ' variant' ] }, ' of the flatorized implementation of ', { code : 'naive_v8' }, '. Flatorization eliminates the many recursive function calls, and the generated code looks similar to the ', { code : 'asm.js' }, ' variant. The test runs on the 3 compilers DMD, GDC and LDC2.'
        ]
      }

    , { name : 'fftw3real_gcc'
        , algorithm : [ { 'a href="http://www.fftw.org"' : 'FFTW3.3.4' }, ' (MSR + several other local algorithms, dynamically chosen for the given platform)' ]
        , language : 'C'
        , support : 'Compiler: GCC'
        , description : [
            'State-of-the-art algorithm & implementation of the Discrete Fourier Transform, includes many local, dynamic optimizations (e.g. replace MSR with locally faster algorithms at the deeper levels of recursion). The local optimizations (choice of algorithm) are made dynamically to each platform. FFTW should give a good idea of the fastest achievable speed to date.'
        ]
      }

]
