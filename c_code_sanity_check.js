c_code_sanity_check();

function c_code_sanity_check()
{
    var x        = rand1024real()
    var y_truth  = dftreal16_baseline( x )
    ,   y_flat     = dftreal16flat_hh( x )
    ,   y_flat_sr  = dftreal16flat_sr_hh( x )
    ,   y_flat_msr = dftreal16flat_msr_hh( x )

    ,   epsilon = 1e-10
    ;

    [ y_flat, y_flat_sr, y_flat_msr ].forEach( check_y_against_truth );

    function check_y_against_truth( y )
    {
        for (var k = y.length; k--;)
        {
            var yk = y[ k ]
            ,   tk = y_truth[ k ]
            ;
            if (epsilon < Math.abs( yk[ 0 ] - tk[ 0 ] )  ||  epsilon < Math.abs( yk[ 1 ] - tk[ 1 ] ))
                throw new Error('Insane implementation!');
        }
        
    }
}