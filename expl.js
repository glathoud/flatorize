function augment_name_value_array_with_mapping( /*array of objects { name : ... , value : ... }*/nv_arr )
{
    nv_arr.forEach( augment_one );
    return nv_arr;

    function augment_one( o )
    {
        var name  = o.name
        ,   value = o.value
        ;
        (name || null).substring.call.a;

        nv_arr[ name ] = value;
    }
}

function f2body( f )
{
    var fs = f+'';

    var mo_begin = /^(((?![\r\n])\s)*)\/\/#BEGIN_BODY\s*^/m.exec( fs );
    if (mo_begin)
    {
        var n_indent = mo_begin[ 1 ].length
        ,     mo_end = /^(((?![\r\n])\s)*)\/\/#END_BODY\s*$/m.exec( fs )
        ;
        return fs.substring( mo_begin.index + mo_begin[0].length, mo_end.index )
             .replace( new RegExp( '(^|[\\r\\n])((?![\\r\\n])\\s){' + n_indent + ',' + n_indent + '}', 'g' ) , '$1' )
        ;
    }
    
    return (f+'').replace(/^[^\{]*?\{([\s\S]*)\}[^\}]*$/, '$1' )
}

function expl_run( f, /*?object?*/opt )
{
    var opt_args   = opt  &&  opt.args
    ,   doc_silent = opt  &&  opt.doc_silent
    ,   PRECISION  = 1e-9
    ;

    try {
        var r = f.apply( null, opt_args )
        ,   s_expected = JSON.stringify( cut_precision( r.expected ) )
        ,   s_obtained = JSON.stringify( cut_precision( r.obtained ) )

        ,  ok = s_expected === s_obtained

        , html_expected = html_escape( s_expected )
        , html_obtained = html_escape( s_obtained )
        ;
        if (!doc_silent)
            document.write( f2body( f ) + '\n// ' + r.name + ': ' + html_obtained + (ok  ?  '   // Yes!'  :  '   // NOOOO!\n//\n// expected:\n// ' + r.name + ': ' + html_expected ) );
    } catch (e) {
        if (doc_silent)
            throw e;
        else
            document.write( '--- expl_run: FAILED! ---\n\ne:\n\n' + e );
        ok = false;
    }
    return ok;

    function cut_precision( x )
    {
        var tof_x = typeof x;
        
        if ('number' === tof_x)
            return Math.round(x/PRECISION)*PRECISION;

        if ('object' === tof_x)
        {
            var ret = x instanceof Array  ?  []  :  {};
            for (var k in x) { if (!(k in ret)) {   // More flexible than hasOwnProperty
                ret[ k ] = cut_precision( x[ k ] );
            }}
            return ret;
        }
        
        return x;
    }

    function html_escape( s )
    {
        return s
            .replace( /&/g, '&amp;' )
            .replace( /</g, '&lt;' )
            .replace( />/g, '&gt;' )
            .replace( /"/g, '&quot;' )
            .replace( /'/g, '&apos;' )
        ;
    }
}
