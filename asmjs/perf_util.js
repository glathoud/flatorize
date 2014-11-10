/*global window ArrayBuffer console asmjs_perf_compare_gen_dft asmjs_remove_use_asm_from_gen asmjs_perf_format_one_result asmjs_perf_prop_2_percent_string asmjs_remove_typed_array_from_gen */

function asmjs_perf_format_one_result( /*string*/name, /*object*/r )
{
    (name || null).substring.call.a;
    return name + ': speed: ' + r.speed_iter_per_sec.toPrecision( 3 ) + ' iterations/second.';
}


function asmjs_perf_prop_2_percent_string( x )
{
    var percent = 100 * (x - 1);
    return (percent > 0  ?  '+'  :  '') + Math.round( percent ) + '%';
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

        var        x = candidates[ name ]
        ,       cand = 'function' === typeof x  ?  { normal_array : false, gen : x }  :  x

        , duration_sec
        ;

        // Direct functional call (typical `flatorize` implementation.)

        if (cand.fun)
        {
            var start = Date.now();

            for (var i = N; i--;)
                var output = cand.fun( input );
            
            duration_sec = (Date.now() - start) / 1000;
        }
        else
        {
            // Implementation generator, typed array, in-place implementation 
            // (typical `flatorize.getAsmjsGen()` implementation.)

            var use_typed_array = !cand.normal_array
            ,               gen = cand.gen
            
            ,        n2i = gen.array_name2info
            
            ,     buffer = use_typed_array  ?  new ArrayBuffer( gen.buffer_bytes )  :  new Array( gen.count )
            ,   compiled = gen( window, {}, buffer )

            , info_arr  = n2i.arr
            , info_freq = n2i.freq

            ,  input_view = use_typed_array  &&  new gen.TypedArray( buffer, info_arr.begin_bytes,  info_arr.n  )
            , output_view = use_typed_array  &&  new gen.TypedArray( buffer, info_freq.begin_bytes, info_freq.n )

            ,        impl = compiled[ 'dftreal' + dftsize + 'flat' ]
            ;
            
            if (input.length !== info_arr.n)
                null.bug;

            if (use_typed_array)
                input_view.set( input );
            else
                buffer.splice.apply( buffer, [ info_arr.begin, info_arr.n ].concat( input ) );
            
            var start = Date.now();

            for (var i = N; i--;)
                impl();

            duration_sec = (Date.now() - start) / 1000;
        }
        
        result[ name ] = { 
            n_iter               : N 
            , duration_sec       : duration_sec
            , speed_iter_per_sec : N / duration_sec
        };
    }}
    
    return result;
}



function asmjs_remove_typed_array_from_gen( gen )
{
    var WTA = '_without_typed_array';
    if (!gen[ WTA ])
    {
        var gen_code = gen + ''
        ,   mo       = /^\s*function\s+\w+?\(\s*([^\)]+)\s*\)\s*\{([\s\S]+)\}\s*$/.exec( gen_code )
        ,   param    = mo[ 1 ].replace( /\/\*.*?\*\//g, '' )
        ,   body     = mo[ 2 ]
        ,   new_body = body.replace( /new\s+stdlib\s*\.\s*\w+?Array\s*\((.*?)\)/g , '$1' )
        ;
        if (body === new_body)
            throw new Error( 'Typed Array constructor call not found!' );
        
        var new_gen = new Function( param, new_body );

        // Copy the extra information like `array_name2info`, `TypedArray` etc.
        for (var propname in gen) { if (!(propname in new_gen)) {
            new_gen[ propname ] = gen[ propname ];
        }}
        
        // Store in the cache
        
        gen[ WTA ] = new_gen;
    }
    return gen[ WTA ];
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
