/*global console document asmjs_perf_use_asm genflatcode_asmjs_dftreal1024flat asmjs_remove_use_asm_from_gen asmjs_perf_compare_gen_dft asmjs_perf_format_one_result dftreal1024flat_asmjsGen*/

function asmjs_perf_use_asm()
{
    // Make sure we have an implementation
    genflatcode_asmjs_dftreal1024flat();

    var    with_use_asm_gen = dftreal1024flat_asmjsGen
    ,   without_use_asm_gen = asmjs_remove_use_asm_from_gen( with_use_asm_gen )
    ,                result = asmjs_perf_compare_gen_dft( 
        1024
        , { with_use_asm_gen      : with_use_asm_gen
            , without_use_asm_gen : without_use_asm_gen
          }
    )
    ;

    console.log( 'asmjs_perf_use_asm: result:', result );

    var outnode = asmjs_perf_use_asm.outnode;
    if (!outnode)
    {
        outnode = asmjs_perf_use_asm.outnode = document.getElementById( 'asmjs_perf_use_asm_output' );
        outnode.innerHTML = '';
    }
    
    outnode.innerHTML += asmjs_perf_format_one_result( 'without "use asm"', result.without_use_asm_gen ) + '\n'
        + asmjs_perf_format_one_result( 'with    "use asm"', result.with_use_asm_gen ) + '\n'
        + '-> speedup: ' 
        + asmjs_perf_prop_2_percent_string( result.with_use_asm_gen.speed_iter_per_sec / result.without_use_asm_gen.speed_iter_per_sec ) + '\n'
        +'\n'
    ;
}
