/*global passed asmjs_complex_numbers_check matmulrows_zip_342_asmjsGen ArrayBuffer window Float32Array*/

var passed;
function asmjs_dftreal16flat_check()
{
    (passed  ||  (passed = {})).asmjs_dftreal16flat_check = false;

    // "DFT REAL 16" example

    // --- Inputs and output
    var dftreal16flat_buffer = new ArrayBuffer( 
        dftreal16flat_asmjsGen.buffer_bytes 
    );

    // --- Compile the asm.js code
    var dftreal16flat_asmjsO = dftreal16flat_asmjsGen( 
        window, {}, dftreal16flat_buffer 
    );

    // --- Example of use

    var      n2i = dftreal16flat_asmjsGen.array_name2info
    , TypedArray = dftreal16flat_asmjsGen.TypedArray
    
    // Input views

    , arr  = new TypedArray( 
        dftreal16flat_buffer, n2i.arr.begin_bytes, n2i.arr.n 
    )
    
    // Output view                                  

    , freq = new TypedArray( 
        dftreal16flat_buffer, n2i.freq.begin_bytes, n2i.freq.n 
    )
    ;

    // Write input values

    var io = get_dftreal_sin_input_output_for_check( 16 );

    arr.set( io.input );
    
    // Compute
    dftreal16flat_asmjsO.dftreal16flat();
    
    // The result is accessible through `freq`
    var error_v = io.expected
        .reduce( function (a,b) { return a.concat(b); }
                 , [] )
        .map( function (number,i) { return number - freq[ i ]; } )
    
    , error = Math.max.apply( Math, error_v.map( 
        function (delta) { return Math.abs( delta ); } 
    ) )
    ;
    if (1e-10 < error)
        throw new Error( 'asmjs_dftreal16flat_check failed!' );

    (passed  ||  (passed = {})).asmjs_dftreal16flat_check = true;

}
