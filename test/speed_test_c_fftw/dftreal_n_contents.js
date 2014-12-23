function dftreal_n_contents( dftsize )
{
    var cache = (dftreal_n_contents._cache || (dftreal_n_contents._cache = {}));

    if (!(dftsize in cache))
    {
        var h3_arr = document.getElementsByTagName( 'h3' )
        ,    c_arr = []
        ;
        for (var n = h3_arr.length, i = 0; i < n; i++)
        {
            var  h3 = h3_arr[ i ]
            ,    id = h3.id
            ;
            if (id)
            {
                var text = h3.textContent;
                
                var anchor = document.createElement( 'a' );
                anchor.setAttribute( 'href', '#' + id );
                anchor.textContent = '#';

                h3.appendChild( document.createTextNode( ' ' ) );
                h3.appendChild( anchor );

                c_arr.push({
                    id     : id
                    , text : text
                });
            }
        }

        cache[ dftsize ] = yak( { ul : c_arr.map( content_line ).map( yak.f( '{ li : v }' )) } );
    }
    
    return cache[ dftsize ];

    function content_line( x )
    {
        return yak.o( 'a href="#' + x.id + '"',  x.text );
    }
}
