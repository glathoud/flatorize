(function () {

    return [
        { h3 : 'Results for each environment' }
    ].concat(
        yak.readeval( 'dftreal1024.results.list.json' )
            .map( one_table )
            .reduce( yak.f( '.concat( [ { hr:null } ] ).concat( k )' ) )
    )
    ;

    // --- Details

    function one_table( filename )
    {
        var top = yak.readeval( filename )
        , environment_name = top.environment_name
        ,   o      = top.result
        ,   cs  = extract_cpuinfo_system( o )
        ,   arr = Object.keys( o ).map( extract_name_and_speed, o )
        , nlmax = Math.max.apply( Math, arr.map( yak.f( '.name.length' ) ) )
        , sparr = arr.map( yak.f( '.iter_per_sec' ) )
        , spmin = Math.min.apply( Math, sparr )
        , spmax = Math.max.apply( Math, sparr )

        , log_spmin = Math.log( spmin )
        , log_spmax = Math.log( spmax )
        , log_delta = log_spmax - log_spmin

        , cpuinfo_dom_id   = get_new_domid()
        , otherinfo_dom_id = get_new_domid()

        , extra_meta = extract_extra_meta( o, cs )
        ;
        
        arr.sort( function ( a, b ) { return a.iter_per_sec - b.iter_per_sec; } );
        
        return [ 
            { p : [ yak.html( '&ndash; Result file: ' ), filename ] }

            , { pre : { code : 'environment_name:' } }
            , { blockquote : { pre : { code : environment_name } } }

            , { pre : { code : 'system:' }}
            , { blockquote : { pre : { code : cs.system } } }

            , { pre : { code : [ 'cpuinfo:', show_hide_button( cpuinfo_dom_id ) ] } }
            , show_hide_content( cpuinfo_dom_id, cs.cpuinfo )

            , { pre : { code : [ 'other information:', show_hide_button( otherinfo_dom_id ) ] } }
            , show_hide_content( otherinfo_dom_id, extra_meta )
            
            , { pre : { code : 'results: speed in iterations per second (log scale ; the further right, the faster):' } }
            , { blockquote : { pre : { code : yak.html( arr.map( one_log_line ).join( '\n' ) ) } } }
        ];

        function one_log_line( x )
        {
            var ndash = 2 + Math.round( 48 * (Math.log( x.iter_per_sec ) - log_spmin) / log_delta);
            return sRep( '&mdash;', ndash ) + ' ' + Math.round( x.iter_per_sec ) + '   ' + x.name;
        }

        function sRep( c, n )
        {
            return new Array( 1 + n ).join( c );
        }
    }

    function extract_cpuinfo_system( o )
    {
        for (var k in o) { if (o.hasOwnProperty( k )) {
            
            var      v = o[ k ]
            ,  cpuinfo = v.meta.cpuinfo
            ,  system  = v.meta.system
            ;
            (cpuinfo  ||  null).substring.call.a;
            (system   ||  null).substring.call.a;
            
            // Assumed similar for others on this platform
            // at most the CPU frequency might have changed
            return { cpuinfo : cpuinfo, system : system };
        }}
    }

    function extract_extra_meta( o, cs )
    {
        var set = {};
        for (var k in o) { if (o.hasOwnProperty( k )) {

            var  v = o[ k ]
            , meta = v.meta
            ;
            
            for (var mk in meta) { if (!(mk in cs)) {
            
                var mv = meta[ mk ].replace( /^\s+|\s+$/g, '' );
                
                if (!(mk in set))
                    set[ mk ] = mv;
                else if (set[ mk ] !== mv)
                    null.bug;
            }}
        }}
        
        var k_arr = Object.keys( set ).sort();

        return k_arr.map( one_meta_block );

        function one_meta_block( k )
        {
            return [ k + ': '
                     , { blockquote : set[ k ] }
                   ];
        }
    }

    function extract_name_and_speed( k )
    {
        (k  ||  null).substring.call.a;

        var          v = this[ k ]
        , iter_per_sec = v.result.iter_per_sec 
        ;
        (iter_per_sec  ||  null).toPrecision.call.a;
        
        return { 
            name : k
            , iter_per_sec : iter_per_sec
        };
    }

    function get_new_domid()
    {
        var id;
        while (document.getElementById( id = '' + Math.round( 1e9 * Math.random())))
            ;
        return id;
    }


    function show_hide_button( domid, text )
    {
        return yak.o(
            'button onclick="var tmp=document.getElementById(\'' + domid + '\');tmp.style.display=tmp.style.display?\'\':\'none\'"'
            , text  ||  'show/hide' 
        );
    }
    
    function show_hide_content( domid, content )
    {
        return yak.o( 'blockquote id="' + domid + '"style="display:none"', { pre : { code : content } } )
    }

})()