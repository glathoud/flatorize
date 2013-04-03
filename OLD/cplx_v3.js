// Preliminary experiment to generate functions. 
// Use case: calculations in complex domain.
//
// Diff with ./cplx_v2.js: non-string expressions are now permitted
// so that we can solve a few computation *while generating code*.
//
// Thus we replaced:
//     ,   creal = exprF('a',     function (a) { return a + '[0]'; })
//     ,   cimag = exprF('a',     function (a) { return a + '[1]'; })
//     , cplx  = exprF('re,im',   function (re,im) { return '[ ' + re + ', ' + im + ']'; })
//
// with:
//     ,   creal = exprF('a',     function cc(a) { return at( a, 0 ); })
//     ,   cimag = exprF('a',     function dd(a) { return at( a, 1 ); })
//     , cplx  = exprF('re,im', function ee(re,im) { return [ re, im ]; })
//     
// As you can see in `f.direct`, this reduces useless computations,
// but the approach cannot scale to cases with duplicate operations.
// 
// Guillaume Lathoud
// December 2012
//
// cadd:
// function switcher() {
//     if (exprF.creatingDirect) {
//         var code = exprgen.apply(null, arguments);
//         return "string" === typeof code ? "(" + code + ")" : code;
//     }
//     if (!direct) {
//         if (exprF.creatingDirect) {
//             throw new Error("bug exprF direct!");
//         }
//         exprF.creatingDirect = 1;
//         direct = switcher.direct = new Function(varstr, "return " + code2str(exprgen.apply(null, vararr)) + ";");
//         exprF.creatingDirect = 0;
//     }
//     return direct.apply(null, arguments);
// }
// 
// cadd.direct:
// function anonymous(a, b) {
//     return [a[0] + b[0], a[1] + b[1]];
// }
// 
// f.direct:
// function anonymous(a, b, c) {
//     return [a[0] - (b[0] + c[0]), a[1] - (b[1] + c[1])];
// }

/*global cadd cplx creal cimag exprF*/
var cadd  = exprF('a,b',   function aa(a,b)   { return cplx( creal(a) + '+' + creal(b), cimag(a) + '+' + cimag(b) ); } )
,   csub  = exprF('a,b',   function bb(a,b)   { return cplx( creal(a) + '-' + creal(b), cimag(a) + '-' + cimag(b) ); } )
,   creal = exprF('a',     function cc(a) { return at( a, 0 ); })
,   cimag = exprF('a',     function dd(a) { return at( a, 1 ); })
, cplx  = exprF('re,im', function ee(re,im) { return [ re, im ]; })
;
function at( x, where )
{
    if ('string' !== typeof x)   // Try to solve right away
        return x[ where ];

    // Else form an expression string
    return x + '[' + ( 'number' === typeof where  ?  where  :  '"' + where + '"' ) + ']';
}
function exprF(/*comma-separated string*/varstr, /*function*/exprgen)
{
    if (exprF.within)
        throw new Error('only one exprF at a time!');
    exprF.within = 1;
    

    var vararr = varstr.split(',').map(function(s) { return s.trim(); })
    ,   direct
    ;
    
    switcher.exprgen = exprgen; // xxx debug

    delete exprF.within;
    return switcher;

    function switcher()
    {
        if (exprF.creatingDirect)
        {
            var code = exprgen.apply( null, arguments );  // To be called with variable name strings
            return 'string' === typeof code  ?  '(' + code + ')'  :  code;
        }
        
        if (!direct)
        {
            if (exprF.creatingDirect)
                throw new Error('bug exprF direct!');
            exprF.creatingDirect = 1;
            direct = switcher.direct = new Function (varstr, 'return ' + code2str( exprgen.apply(null,vararr) ) + ';');  // To be called with values)
            exprF.creatingDirect = 0;
        }

        return direct.apply( null, arguments );
    }
}
function code2str( code )
{
    if (typeof code === 'string')
        return code;

    if (code instanceof Array)
        return '[ ' + code.map( code2str ).join(', ') + ' ]';

    if ('object' === typeof code)
    {
        var retArr = [];
        for (var k in code) if (code.hasOwnProperty(k))
            retArr.push( k + ': ' + code2str( code[k] ))
        return '{ ' + retArr.join(', ') + ' }';
    }

    return '' + code;
}

var a = cplx(1,2)
,   b = cplx(10,100)
,   c = cadd(a,b)
,   d = csub(a,cadd(b,c))
,   f = exprF('a,b,c',function (a,b,c) { return csub(a,cadd(b,c));})
,  d2 = f(a,b,c)
;
