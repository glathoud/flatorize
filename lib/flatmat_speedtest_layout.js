function toggle_parent_shown( node )
{
    var pN = node.parentNode;
    pN.classList[ pN.classList.contains('shown')?'remove':'add' ]( 'shown' );
}

(function () {

    var contents = qSA( '.contents' );
    
    qSA('section[id]').forEach( setup_anchor );

    var api = gEBI( 'api' );
    if (api)
    {
        [ fm_id
          , fm_inv_of_ij
          , fm_mul_of_ijk
          , fm_mu_sigma_of_dim
          , fm_xvmxv_of_dim
        ]
            .forEach( api_describe_one )
        ;
    }
    
    function setup_anchor( section_node )
    {
        var id = gA( 'id', section_node )
        ,   h  = id  &&  qS( 'h1,h2,h3', section_node )
        ;
        if (id  &&  h)
        {
            var s_html = h.innerHTML;
            
            aC( h
                , anchor_link_of_id( id )
              );

            contents.forEach( setup_one_line_in_contents );
        }

        function setup_one_line_in_contents( ul )
        {
            aC( ul
                , aC( cE( 'li' )
                      , sP( sA( cE( 'a' ), { href : '#' + id } )
                          , { innerHTML : s_html }
                        )
                    )
              );
        }
    }

    function api_describe_one( f, i, noli )
    {
        var src = ''+f;

        var mo = /^\s*function\s+((\S+?)\(.*?)$\s*\/\*\s*([\s\S]*?)\*\//m.exec( src )
        , title = mo[ 1 ]
        , name  = mo[ 2 ]
        , a_id  = 'api_' + name

        , expl_f = name in fm_unittest  &&  fm_unittest[ name ]

        , descr = '<p>' + mo[ 3 ]
            .replace( /`([^`]+)`/g, '<code class="prettyprint lang-js">$1</code>' )
            .replace( /[\r\n]\s+[\r\n]/g, '</p><p>' )
            + '</p>'
            + (!expl_f  ?  ''  :
               '<div>'
               + '<button onclick="toggle_parent_shown(this)"><span class="when_hidden">show</span><span class="when_shown">hide</span> example</button>'
               + '<pre class="when_shown prettyprint lang-js">' + clean_body( expl_f ) + '</pre>'
               + '</div>'
              )
            + (i < noli.length - 1  ?  '<hr/>'  :  '')
        ;

        aC( api
            , aC( sA( cE( 'dt' )
                      , { id : a_id }
                    )
                  , sP( sA( cE( 'code' )
                            , { 'class': 'prettyprint lang-js' }
                          )
                        , { innerHTML : title }
                      )
                  , anchor_link_of_id( a_id )
                )
            , aC( cE( 'dd' )
                  , sP( cE( 'span' )
                        , { innerHTML : descr }
                      )
                )
          );
    }
    

    function anchor_link_of_id( id )
    {
        return sA( aC( cE( 'span' )
                       , sP( sA( cE( 'a' )
                                 , { href: '#' + id }
                               )
                             , { 'innerHTML' : '#' }
                           )
                     )
                   , { 'class' : 'anchor-link' }
                 );
    }

    function clean_body( f )
    {
        var mo = /^[^\{]*\{([\s\S]*)\}\s*$/.exec( f )
        , body = mo[ 1 ]
        , line_arr = body.match( /[\s\S]*?[\r\n]+/g )
        , len_arr = line_arr.map( li => /^\s*$/.test( li )  ?  +Infinity  :  /^\s+/.exec( li )[ 0 ].length )
        , indent   = Math.min.apply( Math, len_arr )
        ;
        
        return line_arr.map( li => li.substring( indent ) ).join( '' );
    }
    
})();
