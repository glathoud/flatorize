function ( dftsize )
{
    return [
        { 'h3 id="test-browser"' : 'You can also run some of the speed tests directly here in the browser:' }
    ].concat(
        [ 'naive', 'flatorize', 'flatorize_asmjs' ].map( function ( testname ) {
            
            var fname = 'dftreal_n_speed_test_' + testname
            , outname = 'dftreal' + dftsize + '_speed_test_' + testname + '_output'
            ;

            return [ 
                { h4 : testname }
                , yak.o( 'button onclick="' + fname + '(' + dftsize + ',this,\'' + outname + '\')"', 'Measure the speed of ' + testname )
                , { pre : yak.o( 'code id="' + outname + '"', '' ) }
            ];
        }).reduce( yak.f( '.concat(k)' ))
    );
}