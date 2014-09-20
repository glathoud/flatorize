asmjs_complex_numbers_check();

function asmjs_complex_numbers_check()
{
    // "Complex numbers" example

    // --- Inputs and output
    var f2_buffer = new ArrayBuffer( 1 << 24 );

    // --- Compile the asm.js code
    var f2_asmjsO = f2_asmjsGen( window, {}, f2_buffer );

    // --- Example of use
    // Input views
    var a = new Float64Array( f2_buffer, 8*0, 2 )
    ,   b = new Float64Array( f2_buffer, 8*2, 2 )
    ,   c = new Float64Array( f2_buffer, 8*4, 2 )
    // Output view
    ,   d = new Float64Array( f2_buffer, 8*6, 2 )
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
    if (1e-10 < error)
        throw new Error( 'asmjs_complex_numbers_check failed!' );
}
