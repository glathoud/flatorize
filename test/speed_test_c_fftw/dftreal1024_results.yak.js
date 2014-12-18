(function () {

    return [
        { h3 : 'Results for each environment' }
    ].concat(
        yak.readeval( 'dftreal1024.results.list.json' )
            .map( one_table )
            .reduce( yak.f( '.concat( [ { hr:null } ] ).concat( k )' ) )
    )
    ;

    function one_table( filename )
    {
        var o  = yak.readeval( filename )
        ,   cs = extract_cpuinfo_system( o )
        ;
               
        return [ 
            { p : 'Result file: ' + filename }
            , { pre : { code : 'system:' }}
            , { blockquote : { pre : { code : cs.system } } }
            , { pre : { code : 'cpuinfo:' }}
            , { blockquote : { 'pre style="max-height:250px; overflow: auto;"' : { code : cs.cpuinfo }} }
            , { pre : { code : 'results:' } }
            , { blockquote : { pre : { code : JSON.stringify( o, null, 2 ) } } }
        ];
    }

    // --- Details

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

})()