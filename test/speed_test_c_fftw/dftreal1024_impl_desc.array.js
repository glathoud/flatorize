[
    { name : 'naive_v8'
      , algorithm : 'MSR (Modified Split-Radix)'
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
            'Flatorized JavaScript implementation of ', { code : 'naive_v8' }, '. Flatorization eliminates the many recursive function calls. The test runs on the V8 JavaScript engine.'
        ]
      }

    , { name : 'flatorize_asmjs_v8'
        , algorithm : 'MSR'
        , language : 'JavaScript'
        , support : 'V8 engine'
        , description : [
            { code : 'asm.js' }, ' variant of the flatorized JavaScript implementation of ', { code : 'naive_v8' }, '. Flatorization eliminates the many recursive function calls, and the generated code is ', { code : 'asm.js' }, '-compatible, heavily using typed arrays for further speedup. The test runs on the V8 JavaScript engine.'
        ]
      }

    , { name : 'flatorize_c'
        , algorithm : 'MSR'
        , language : 'C'
        , support : 'GCC, clang'
        , description : [
            { code : 'C' }, ' variant of the flatorized implementation of ', { code : 'naive_v8' }, '. Flatorization eliminates the many recursive function calls, and the generated code looks similar to the ', { code : 'asm.js' }, ' variant. Both GCC and clang are tested.'
        ]
      }


]
