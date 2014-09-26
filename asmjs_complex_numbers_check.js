/*global passed asmjs_complex_numbers_check f2_asmjsGen ArrayBuffer window Float32Array*/

asmjs_complex_numbers_check();

var passed;
function asmjs_complex_numbers_check()
{
    // "Complex numbers" example

    // --- Inputs and output
    var f2_buffer = new ArrayBuffer( f2_asmjsGen.buffer_bytes );

    // --- Compile the asm.js code
    var f2_asmjsO = f2_asmjsGen( window, {}, f2_buffer );

    // --- Example of use
    // Input views
    var n2i = f2_asmjsGen.array_name2info

    ,   a = new Float32Array( f2_buffer, 4 * n2i.a.begin, n2i.a.n )
    ,   b = new Float32Array( f2_buffer, 4 * n2i.b.begin, n2i.b.n )
    ,   c = new Float32Array( f2_buffer, 4 * n2i.c.begin, n2i.c.n )
    // Output view
    ,   d = new Float32Array( f2_buffer, 4 * n2i.d.begin, n2i.d.n )
    ;

    // Write input values
    a.set([1.2, -3.4]);
    b.set([0,   1]);
    c.set([-1,  9.99]);

    // Compute
    f2_asmjsO.f2();
    
    // The result is accessible through `d`
    var error_v = [
        d[0]   - (1.2  - 2*(0 + -1))
        , d[1] - (-3.4 - 2*(1 + 9.99))
    ]
    , error = Math.max.apply( Math, error_v.map( function (delta) { return Math.abs( delta ); } ) )
    ;
    if (1e-5 < error)
        throw new Error( 'asmjs_complex_numbers_check failed!' );

    (passed  ||  (passed = {})).asmjs_complex_numbers_check = true;
}
