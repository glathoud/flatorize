function fm2d_speedtest_flatmatmul_inplace( cont_domnode )
{
    var result_domnode  = cont_domnode.querySelector( '.result' )
    ,   gencode_domnode = cont_domnode.querySelector( '.generated-code' )
    ;
    
    var flatmatmul_inplace_342 = fm2d_flatmatmul_inplace_of_ijk( 3, 4, 2 );
    
    var a = new Float64Array([
        1,2,3,4
        , 5,6,7,8
        , 9,10,11,12
    ])
    ,   b = new Float64Array([
        13,14
        , 15,16
        , 17,18
        , 19,20
    ])
    ,   c = new Float64Array( 3 * 2 )
    ;

    var N = 50000000;

    var start_ms = Date.now();

    for (var i = N; i--;)
        flatmatmul_inplace_342( a, b, c );
    
    var duration_sec = (Date.now() - start_ms) / 1000
    ,   speed = N / duration_sec
    ;

    result_domnode.textContent += 'speed (iter/sec): ' + speed.toPrecision( 5 ) + ' (' + N + '/' + duration_sec.toPrecision( 5 ) + ')\n';

    gencode_domnode.textContent = '---\nGenerated code:\n' + flatmatmul_inplace_342;
}
