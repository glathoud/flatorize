var cadd  = function (a,b)   { return cplx( creal(a) + creal(b), cimag(a) + cimag(b) ); }
,   csub  = function (a,b)   { return cplx( creal(a) - creal(b), cimag(a) - cimag(b) ); }
,   creal = function (a)     { return a[ 0 ]; }
,   cimag = function (a)     { return a[ 1 ]; }
,   cplx  = function (re,im) { return [ re, im ]; }
;
var a = cplx(1,2)
,   b = cplx(10,100)
,   c = cadd(a,b)
,   f = function (a,b,c) { return csub( csub(a,cadd(b,c)), cadd(b,c) ); }
,   d = f(a, b, c)
;

time('f')
for (var n = 1e6; n--;)
    d = f(a,b,c);
timeEnd('f')

// Chrome 22:
// f: 186ms
//
// Firefox 16: (deactivated the alert "stop this script?")
// f: 5472ms
//
// Chromium 20:
// f: 201ms 
//
// V8 version 3.7.12
// f: 130ms
//
// Rhino 1.7 release 3 2012 02 16
// f: 1460ms

function log(/*...arguments...*/)
{
    // Browser environment
    if (typeof console !== 'undefined'  &&  console.log)
    {
	try
	{
	    console.log.apply( console, arguments );
	}
	catch (e) 
	{
	    // Probably some IE browser
	    console.log( Array.prototype.join.call( arguments, ' ' ) )
	}
    }
    
    else
    {
        // Non-browser environment
        print.apply( null, arguments );
    }
}

function time(name)
{
    // Browser environment
    if (typeof console !== 'undefined'  &&  console.log)
    {
        console.time(name);
    }
    else
    {
        time[name] = new Date;  // Using the fact that JavaScript functions are objects as well.
    }
}

function timeEnd(name)
{
    // Browser environment
    if (typeof console !== 'undefined'  &&  console.log)
    {
        console.timeEnd(name);
    }
    else
    {
        time[name] = new Date - time[name];
        log(name, time[name] + 'ms');
    }
}
