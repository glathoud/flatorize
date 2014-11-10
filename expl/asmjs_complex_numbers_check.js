/*global passed asmjs_complex_numbers_check f2_asmjsGen ArrayBuffer window Float32Array*/

var passed, f2_asmjsGen;
function asmjs_complex_numbers_check()
{
    (passed  ||  (passed = {})).asmjs_complex_numbers_check = false;

    // "Complex numbers" example
    
    if (typeof f2_asmjsGen === 'undefined')
        f2_asmjsGen = flatorize.getAsmjsGen( { switcher: f2, name: "f2" } );

    // --- Inputs and output
    var f2_buffer = new ArrayBuffer( f2_asmjsGen.buffer_bytes );

    // --- Compile the asm.js code

    var f2_asmjsO = f2_asmjsGen( this, {}, f2_buffer );

    // --- Example of use
    // Input views
    var         n2i = f2_asmjsGen.array_name2info
    ,    TypedArray = f2_asmjsGen.TypedArray

    ,   a = new TypedArray( f2_buffer, n2i.a.begin_bytes, n2i.a.n )
    ,   b = new TypedArray( f2_buffer, n2i.b.begin_bytes, n2i.b.n )
    ,   c = new TypedArray( f2_buffer, n2i.c.begin_bytes, n2i.c.n )
    // Output view                                  
    ,   d = new TypedArray( f2_buffer, n2i.d.begin_bytes, n2i.d.n )
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
    , error = Math.max.apply( Math, error_v.map( 
        function (delta) { return Math.abs( delta ); } 
    ) )
    ;
    if (1e-5 < error)
        throw new Error( 'asmjs_complex_numbers_check failed!' );

    (passed  ||  (passed = {})).asmjs_complex_numbers_check = true;
}
