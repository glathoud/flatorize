function expl_matmulrows_loops()
{
    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_matmulrows_loops;
    E.matmulrows_loops = matmulrows_loops;

    //#BEGIN_BODY
    function matmulrows_loops( a, b )
    {
        var nrow = a.length
        ,   ncol = b[ 0 ].length
        ,   ret  = new Array( nrow )
        ,   nrow_b = b.length
        ;
        for (var ir = 0; ir < nrow; ir++)
        {
            var ra = a[ ir ]
            ,   rr = ret[ ir ] = new Array( ncol )
            ;
            for (var ic = 0; ic < ncol; ic++)
            {
                var x = 0;
                for (var irb = 0; irb < nrow_b; irb++)
                {
                    x += ra[ irb ] * b[ irb ][ ic ];
                }
                rr[ ic ] = x;
            }
        }
        return ret;
    }

    // Does this work?

    var a = [ [1,2,3,4], [5,6,7,8], [9,10,11,12] ]
    ,   b = [ [13,14], [15,16], [17,18], [19,20] ]
    ,   c = matmulrows_loops( a, b )
    ;
    //#END_BODY

    // For `expl_run`

    return { name : 'c', obtained : c, expected : [[170,180],[426,452],[682,724]] };

}
