function expl_matmulrows_zip()
{
    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_matmulrows_zip;
    E.matmulrows_zip = matmulrows_zip;
    E.zip            = zip;
    E.sum            = sum;

    //#BEGIN_BODY
    function matmulrows_zip( a, b )
    {
        return a.map( function (ra) { 
            return zip.apply( null, b ).map( function (cb) {
                return sum( 
                    zip( ra, cb )
                        .map( function (xy) { 
                            return xy[ 0 ] * xy[ 1 ]; 
                        } )
                );
            } );
        } );
    }

    // Tools

    function zip(/*...arguments...*/)
    {
        var arg = [].slice.apply( arguments );
        if (!arg.length)
            return [];
        
        var n = arg[ 0 ].length
        , ret = new Array( n )
        ;
        for (var i = 0; i < n; i++)
            ret[ i ] = arg.map( function (x) { return x[i]; } );
        
        return ret;
    }

    function sum( a ) 
    { 
        return a.reduce( function (c,d) { return c + d; }, 0 ); 
    }

    // Does this work?

    var a = [ [1,2,3,4], [5,6,7,8], [9,10,11,12] ]
    ,   b = [ [13,14], [15,16], [17,18], [19,20] ]
    ,   c = matmulrows_zip( a, b )
    ;
    //#END_BODY

    // For `expl_run`

    return { name : 'c', obtained : c, expected : [[170,180],[426,452],[682,724]] };
}
