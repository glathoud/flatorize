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

// xxx    try {
        var r = f.apply( null, opt_args )
        ,   s_expected = JSON.stringify( r.expected )
        ,   s_obtained = JSON.stringify( r.obtained )

        ,  ok = s_expected === s_obtained
        ;
        if (!doc_silent)
            document.write( f2body( f ) + '\n// ' + r.name + ': ' + s_obtained + (ok  ?  '   // Yes!'  :  '   // NOOOO!\n//\n// expected:\n// ' + r.name + ': ' + s_expected ) );
/* xxx   } catch (e) {
        if (!doc_silent)
            document.write( '--- expl_run: FAILED! ---\n\ne:\n\n' + e );
        ok = false;
    }
  */  
    return ok;
}
