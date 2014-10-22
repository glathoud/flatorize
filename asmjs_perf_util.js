/*global window ArrayBuffer console asmjs_perf_compare_gen_dft asmjs_remove_use_asm_from_gen*/

function asmjs_perf_format_one_result( /*string*/name, /*object*/r )
{
    (name || null).substring.call.a;
    return name + ': speed: ' + r.speed_iter_per_sec.toPrecision( 3 ) + ' iterations/second.';
}

function asmjs_perf_compare_gen_dft( /*integer*/dftsize, /*object*/candidates )
{
    (dftsize  ||  null).toPrecision.call.a;

    console.log('asmjs_perf_compare_gen_dft: dftsize: ' + dftsize);
    
    var    input = new Array(dftsize).join(',').split(',').map( Math.random )
    ,          N = Math.round( 1e6 * 16 / dftsize )
    ,  _emptyObj = {}
    ,     result = {}
    ;
    
    for (var name in candidates) { if (!(name in _emptyObj)) {  // More flexible than hasOwnProperty

        var      gen = candidates[ name ]
        ,        n2i = gen.array_name2info
        , TypedArray = gen.TypedArray

        ,     buffer = new ArrayBuffer( gen.buffer_bytes )
        ,   compiled = gen( window, {}, buffer )

        ,  input_view = new TypedArray( buffer, n2i.arr.begin_bytes,  n2i.arr.n  )
        , output_view = new TypedArray( buffer, n2i.freq.begin_bytes, n2i.freq.n )
        ,        impl = compiled[ 'dftreal' + dftsize + 'flat' ]
        ;

        input_view.set( input );

        var start = Date.now();

        for (var i = N; i--;)
            impl();

        var duration_sec = (Date.now() - start) / 1000;
        
        result[ name ] = { 
            n_iter               : N 
            , duration_sec       : duration_sec
            , speed_iter_per_sec : N / duration_sec
        };
    }}
    
    return result;
}


function asmjs_remove_use_asm_from_gen( gen )
{
    var WUA = '_without_use_asm';
    if (!gen[ WUA ])
    {
        var gen_code = gen + ''
        ,   mo       = /^\s*function\s+\w+?\(\s*([^\)]+)\s*\)\s*\{([\s\S]+)\}\s*$/.exec( gen_code )
        ,   param    = mo[ 1 ].replace( /\/\*.*?\*\//g, '' )
        ,   body     = mo[ 2 ]
        ,   new_body = body.replace( /(["'])use asm\1;?/g , '' )
        ;
        if (body === new_body)
            throw new Error( '"use asm" not found!' );
        
        var new_gen = new Function( param, new_body );

        // Copy the extra information like `array_name2info`, `TypedArray` etc.
        for (var propname in gen) { if (!(propname in new_gen)) {
            new_gen[ propname ] = gen[ propname ];
        }}
        
        // Store in the cache
        
        gen[ WUA ] = new_gen;
    }
    return gen[ WUA ];
}
