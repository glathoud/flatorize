function dftreal1024_contents()
{
    if (!('_c_html' in dftreal1024_contents))
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

        dftreal1024_contents._c_html = yak( { ul : c_arr.map( content_line ).map( yak.f( '{ li : v }' )) } );
    }
    
    return dftreal1024_contents._c_html;

    function content_line( x )
    {
        return yak.o( 'a href="#' + x.id + '"',  x.text );
    }
}
