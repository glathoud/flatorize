/*global speed_test*/

function speed_test( cfg )
// Browser: returns nothing, but writes verbosity through `log()` to the console and optionally to an output DOM node.
//
// V8: returns an object containing the results, and writes verbosity through `log()`.
//
// To turn verbosity off, overwrite `log = function (){};`.
{
    var impl = cfg.impl  // function to test (mandatory)

    ,   arg  = cfg.arg  ||  []  // optional arguments to pass to the function
    ,   button = cfg.button  ||  null  // optional DOM node
    ,   output_dom_node_id = cfg.output_dom_node_id  ||  null  // optional string

    ,   mix = cfg.mix  ||  {}  // optional values to pass through to the result (V8 use case).

    ,   dftsize = cfg.dftsize  ||  null
    ;
    // Checks
    impl.call.a;
    button  &&  button.childNodes.a;
    output_dom_node_id  &&  output_dom_node_id.substring.call.a;

    
    var output_dom_node = output_dom_node_id  &&  document.getElementById( output_dom_node_id );
    if (output_dom_node)
	output_dom_node.textContent += '\nTest running. Please be patient...\n';

    var      narg = arg.length
    , argname_arr = new Array( narg ).join( ',' ).split( ',' ).map( function (tmp,i) { 
        return '_' + i; 
    } )

    , measure_fun = new Function(
        [ 'N', 'impl' ].concat( argname_arr ).join( ',' )
        , [
            'var begin = Date.now();'
            , 'for (var i = N; i--;)'
            , '  impl(' + argname_arr.join( ',' ) + ');'
            , 'var duration_sec = (Date.now() - begin) / 1000;'

            , 'return duration_sec;' 
        ].join( '\n' )
    )

    , N = null
    , one_more_time = 2
    ;

    return _speed_test_run();
    
    function _speed_test_run()
    {
        if (N == null)
        {
            N = 1;
            prev_duration_sec = 0;
        }
        
        log( '_speed_test_run: N: ' + N );

        var duration_sec = measure_fun.apply( null, [ N, impl ].concat( arg ) );

        log( '_speed_test_run: -> duration_sec: ' + duration_sec );

        var done = false;

        if (prev_duration_sec > 0.001  &&  duration_sec > prev_duration_sec * 4)
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

        if (done  &&  0 < one_more_time)
        {
            // Let V8 / Chrome warm up the first time (trigger
            // code optimization) then try again (the 2nd time
            // should be enough) then try again to be really sure,
            // show them we want to run this code a lot :)

            done = false;
            one_more_time--;
            N = null;
        }
        
        if (done)
        {
            var iter_per_sec = N / duration_sec;
            
            if ('undefined' !== typeof setTimeout)
            {
                // Browser
                var msg = 'dftreal' + (dftsize  ||  '') + ' speed: ' + iter_per_sec + ' iter / seconds = ' + N + ' iterations / ' + duration_sec + ' seconds';
                
                log( msg );
                
                if (output_dom_node)
                {
                    output_dom_node.textContent += '\n' + msg + '\n';
                }
                
                if (button)
                    button.removeAttribute( 'disabled' );
            }
            else
            {
                // V8
                var ret = Object.create( mix  ||  {} );

                ret.n            = N;
                ret.iter_per_sec = iter_per_sec;
                ret.duration_sec = duration_sec;

                return ret;
            }
            

        }
        else
        {
            var wait_ms = 456; // Give a chance to garbage collection and/or code optimization

            if ('undefined' !== typeof setTimeout)
            {
                // Browser
                setTimeout( _speed_test_run, wait_ms );
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
                return _speed_test_run();
            }
            
        }
        
    }
}
