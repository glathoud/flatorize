/*global console document asmjs_perf_typed_array genflatcode_asmjs_dftreal1024flat asmjs_remove_typed_array_from_gen asmjs_perf_compare_gen_dft asmjs_perf_format_one_result dftreal1024flat_asmjsGen*/

function asmjs_perf_typed_array()
{
    // Make sure we have an implementation
    genflatcode_asmjs_dftreal1024flat();

    // For a meaningful comparison we need to deactivate asm.js
    // because asm.js would compile the Typed Array version,
    // but not the normal array version.
    var without_asm_js_gen = asmjs_remove_use_asm_from_gen( dftreal1024flat_asmjsGen )
    
    ,      with_typed_array = { gen : without_asm_js_gen }

    ,   with_normal_array = { gen : asmjs_remove_typed_array_from_gen( with_typed_array.gen )
                                , normal_array : true
                              }
    ,                result = asmjs_perf_compare_gen_dft( 
        1024
        , { with_typed_array      : with_typed_array
            , with_normal_array : with_normal_array
          }
    )
    ;

    console.log( 'asmjs_perf_typed_array: result:', result );

    var outnode = asmjs_perf_typed_array.outnode;
    if (!outnode)
    {
        outnode = asmjs_perf_typed_array.outnode = document.getElementById( 'asmjs_perf_typed_array_output' );
        outnode.innerHTML = '';
    }
    
    outnode.innerHTML += asmjs_perf_format_one_result( 'with normal array', result.with_normal_array ) + '\n'
        + asmjs_perf_format_one_result( 'with  Typed Array', result.with_typed_array ) + '\n'
        + '-> speedup: ' 
        + asmjs_perf_prop_2_percent_string( result.with_typed_array.speed_iter_per_sec / result.with_normal_array.speed_iter_per_sec ) + '\n'
        + '\n'
    ;
}
