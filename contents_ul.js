(function () {

    var d = document
    ,   gEBCN = 'getElementsByClassName'
    ;

    [].forEach.call( d[ gEBCN ]( 'contents-ul' ), fill_up_contents_ul );

    function fill_up_contents_ul( ul )
    {
        // Read from the DOM

        var arr     = [].slice.call( d[ gEBCN ]( 'anchorable' ) )
        ,   tn      = arr.map( function (node) { return node.tagName.toUpperCase(); } )
        ,   big     = tn.reduce( function (a,b) { return a<b ? a : b; } )
        ,   big_arr = arr.filter( function (x, i) { return this[ i ] === big }, tn )
        ;
        
        // Write into the DOM

        ul.innerHTML = big_arr
            .map( bignode_2_content_li )
            .join( '\n' )
        ;
    }

    function bignode_2_content_li( node )
    {
        var copy = node.cloneNode();
        copy.innerHTML = node.innerHTML;
        
        var    a = copy[ gEBCN ]( 'anchor' )[ 0 ];
        if (!a  ||  /#contents/i.test( a.href ))
        {
            return '';
        }
        else
        {
            a.innerHTML = '';
            a.textContent = copy.textContent;
            return '<li>' + a.outerHTML + '</li>';
        }
    }

})();
