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
        var o = yak.readeval( filename );
        return [ 
            { p : 'Result file: ' + filename }
            , { pre : { code : JSON.stringify( o, null, 2 ) } }
        ];
    }

})()