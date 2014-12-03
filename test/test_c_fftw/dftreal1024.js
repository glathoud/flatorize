if ('undefined' !== typeof load)
{
    // V8

    load( "flatorize.js" );
    load( "flatorize_type_util.js" );
    load( "flatorize_asmjs.js" );
    load( "examples.js" );
    load( "expl.js" );
    load( "expl/dftreal_flatorize.js" );
    load( "expl/asmjs_dftrealflat_check.js" );
    load( "log.js" );
//    load( "test/test_c_fftw/dftreal1024.js" );  // how you can load me from the base directory
}


function dftreal1024_test_asmjs( /*?dom node?*/button, /*?string?*/output_dom_node_id )
// Advice: let me run multiple times. Indeed, as of 2014-12, V8 and
// Chrome need a "warm-up" before they optimize the code - probably
// they first have to see the code is actually being used a lot.
{
    if (button)
        button.setAttribute( 'disabled', 'disabled' );

    var      me = dftreal1024_test_asmjs
    ,   dftsize = 1024
    , hermihalf = true
    ,      name = 'dftreal' + dftsize + 'flat' + (hermihalf  ?  '_hermihalf'  :  '')
    ;

    // create implementation if necessary

    var dftrealflat_asmjsO;
    if (me.dftrealflat_asmjsO)
    {
        dftrealflat_asmjsO = me.dftrealflat_asmjsO;
    }
    else
    {
        generate_small_functions();

        // unit test the flatorize implementation
        var ok = expl_run( expl_dftreal_flatorize, { doc_silent : true, args : [ dftsize, hermihalf ] } );
        if (!ok)
            throw new Error( 'Failed the unit test!' );

        // unit test the flatorize_asmjs implementation

        asmjs_dftrealflat_check( dftsize, hermihalf );

        var name_check = 'asmjs_' + name + '_check';
        if (!passed[ name_check ])
            null.bug;

        // generate an asmjs implementation

        var info = passed_asmjsgen_info[ name_check ]
        , dftrealflat_asmjsGen = flatorize.getAsmjsGen( 
            info.cfg
        )
        , dftrealflat_buffer = new ArrayBuffer( dftrealflat_asmjsGen.buffer_bytes )
        , dftrealflat_asmjsO = dftrealflat_asmjsGen( this, {}, dftrealflat_buffer )
        ,                n2i = dftrealflat_asmjsGen.array_name2info
        ,         TypedArray = dftrealflat_asmjsGen.TypedArray
        ,         input_arr  = new TypedArray( dftrealflat_buffer, n2i.arr.begin_bytes,  n2i.arr.n )
        ,        output_freq = new TypedArray( dftrealflat_buffer, n2i.freq.begin_bytes, n2i.freq.n )
        ;
        dftrealflat_asmjsO[ name ].call.a;
        me.dftrealflat_asmjsO = dftrealflat_asmjsO;

        // prepare some input values
        
        input_arr.set( new Array( input_arr.length ).join(',').split(',').map( Math.random ) );
    }
    
    // speed test

    var               N = 1
    , prev_duration_sec = 0
    ,              impl = dftrealflat_asmjsO[ name ]
    ;
    impl.call.a;
    
    speed_test_async_because_of_garbage_collection();

    function speed_test_async_because_of_garbage_collection()
    {
        log( 'speed_test_async_because_of_garbage_collection: N: ' + N );

        var begin = Date.now();
        for (var i = N; i--;)
        {
            impl();
        }
        var duration_sec = (Date.now() - begin) / 1000;

        log( 'speed_test_async_because_of_garbage_collection: -> duration_sec: ' + duration_sec );

        var done = false;

        if (prev_duration_sec > 0.1  &&  duration_sec > prev_duration_sec * 4)
        {
            // reject result, probably was interrupted by garbage collecting
        }
        else
        {
            prev_duration_sec = duration_sec;
            
            if (duration_sec > 1.0)
                done = true;
            else
                N <<= 1;
        }

        // next

        if (done)
        {
            var iter_per_sec = N / duration_sec;
            
            var msg = 'dftreal1024: asmjs implementation: ' + iter_per_sec + ' iter / seconds = ' + N + ' iterations / ' + duration_sec + ' seconds';
            
            log( msg );
            
            var output_dom_node = output_dom_node_id  &&  document.getElementById( output_dom_node_id );
            if (output_dom_node)
            {
                output_dom_node.textContent += '\n' + msg;
            }
            
            if (button)
                button.removeAttribute( 'disabled' );
        }
        else
        {
            var wait_ms = 456;

            if ('undefined' !== typeof setTimeout)
            {
                // Browser
                setTimeout( speed_test_async_because_of_garbage_collection, wait_ms );
            }
            else
            {
                // V8
                var begin = Date.now();
                while (Date.now() - begin < wait_ms)
                {
                    for (var i = 1e4; i--;)
                        ;
                }
                speed_test_async_because_of_garbage_collection();
            }
            
        }
        
    }
    

}