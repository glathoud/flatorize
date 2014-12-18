// YAK: Yet Another yaK
// 
// I originally wanted to write an HTML page but then I thought I'd
// first write YAK, then write my HTML page using YAK. Just kidding :)
//
// Guillaume Lathoud
// December 2014


(function () {

    var  global = this
    , isBrowser = typeof document !== 'undefined'  &&  
        typeof window !== 'undefined'  &&  
        typeof XMLHttpRequest === 'function'
    ;

    global.yak = yak;
    
    yak.parse = yak_parse;
    yak.paste = yak_paste;

    // Tools

    yak.e         = yak_e;
    yak.eval      = yak_eval;
    yak.f         = yak_f;
    yak.o         = yak_o;
    yak.read      = yak_read;
    yak.readeval  = yak_readeval;

    yak.isBrowser = isBrowser;

    function yak( simple_or_object )
    {
        var t = typeof simple_or_object;

        if ('string' === t)
        {
            return simple_or_object
                .replace( /&/g, '&amp;' )            
                .replace( /</g, '&lt;' )
                .replace( />/g, '&gt;' )            
                .replace( /"/g, '&quot;' )
                .replace( /'/g, '&apos;' )
            ;
        }

        if ('boolean' === t  ||  'number' === t)
            return simple_or_object + '';

        if ('object' !== t)
        {
            throw new Error( 
                'Filename string, or array, or object expected. ' + 
                    'Nothing else.' 
            );
        }

        if (simple_or_object instanceof Array)
            return simple_or_object.map( yak ).join( '\n' );

        var karr = Object.keys( simple_or_object );
        if (karr.length !== 1)
        {
            throw new Error( 
                'A single key is expected, e.g. "hr" or ' + 
                    '"p id=\'dom-id\'" or ' + 
                    '"a href=\'http://link.com\'".' 
            );
        }

        var k = karr[ 0 ];
        if (!k)
            throw new Error( 'A non-empty key is expected.' );

        var tag = k.match( /^\s*(\S+)(?=\s|$)/ )[ 1 ];
        
        var v = simple_or_object[ k ];
        return v == null  
            ?  '<' + k + '/>'  
            :  '<' + k + '>' + yak( v ) + '</' + tag + '>'
        ;
    }

    function yak_e( /*expression or partial expression using `v` (left) and optionally `k` (right) variables*/codestring )
    {
        var leftvar  = 'v'
        ,   rightvar = 'k'
        
        ,   is_left_implicit  = /^\s*(?:[+*\/%&|\^\.=<>\?]|!=|$)/.test( codestring )
	,   is_right_implicit = /[+\-*\/%&|\^\.=<>!]\s*$/      .test( codestring )  &&  !/(\+\+|\-\-)$/.test( codestring )
        ;
        if (is_left_implicit)
            codestring = leftvar + codestring;
        
        if (is_right_implicit)
            codestring += is_left_implicit ? rightvar : leftvar;

        return codestring;
    }
    

    function yak_eval( codestring )
    {
        return new Function( 'return (' + codestring + ');' )();
    }

    function yak_f( codestring )
    {
        return new Function( 'v', 'k', 'return (' + yak_e( codestring ) + ');' );
    }

    function yak_o( k, v )
    {
        var ret = {};
        ret[ k ] = v;
        return ret;
    }
    
    var _yak_parsed = [];
    function yak_parse()
    {
        var noli = [].filter.call( 
            document.getElementsByTagName( 'script' )
            , is_yak_js
        );
        for (var n = noli.length, i = 0; i < n; i++)
        {
            var node = noli[ i ];
            if (!(-1 < _yak_parsed.lastIndexOf( node )))
            {
                _yak_parsed.push( node );

                // Prepare

                var div = document.createElement( 'div' );
                div.innerHTML = yak( yak_eval( node.textContent ) );
                div.setAttribute( 'class', 'yak-parsed' );

                // Replace

                node.parentNode.insertBefore( div, node );
                node.parentNode.removeChild( node );
            }
        }

        function is_yak_js( scriptnode )
        {
            return scriptnode.getAttribute( 'type' ) === 'text/yak.js';
        }
    }
  
    function yak_paste( filename_or_object )
    {
        var markup = yak( 'string' === typeof filename_or_object
                          ?  yak_readeval( filename_or_object )
                          :  filename_or_object
                        );
        if (isBrowser)
            document.write( markup );
        else
            write( markup );
    }

    function yak_read( filename )
    {
        if (isBrowser)
        {
            var xhr = new XMLHttpRequest();
            xhr.open( "GET", filename, /*async:*/false );
            xhr.send();
            if (xhr.status !== 0  &&  xhr.status !== 200)
                throw new Error( 'XHR failed.' );
            
            return xhr.responseText;
        }
        else
        {
            return read( filename );
        }
    }
  
    function yak_readeval ( filename )
    { 
        return yak_eval( yak_read( filename ) );
    }
    
})();
