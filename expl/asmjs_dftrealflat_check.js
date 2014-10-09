/*global passed asmjs_complex_numbers_check matmulrows_zip_342_asmjsGen ArrayBuffer window Float32Array*/

var passed;
function asmjs_dftrealflat_check( /*integer, e.g. 16 or 1024*/dftsize )
{
    var checkname = 'asmjs_dftreal' + dftsize + 'flat_check';
    (passed  ||  (passed = {}))[ checkname ] = false;

    // "DFT REAL" example

    // --- Inputs and output
    
    var dftrealflat_asmjsGen = 
        this[ 'dftreal' + dftsize + 'flat_asmjsGen' ]

    ,    dftrealflat_buffer = 
        new ArrayBuffer( dftrealflat_asmjsGen.buffer_bytes )
    ;

    // --- Compile the asm.js code
    var dftrealflat_asmjsO = dftrealflat_asmjsGen( 
        window, {}, dftrealflat_buffer 
    );

    // --- Example of use

    var      n2i = dftrealflat_asmjsGen.array_name2info
    , TypedArray = dftrealflat_asmjsGen.TypedArray
    
    // Input views

    , arr  = new TypedArray( 
        dftrealflat_buffer, n2i.arr.begin_bytes, n2i.arr.n 
    )
    
    // Output view                                  

    , freq = new TypedArray( 
        dftrealflat_buffer, n2i.freq.begin_bytes, n2i.freq.n 
    )
    ;

    // Write input values

    var io = get_dftreal_sin_input_output_for_check( dftsize );

    arr.set( io.input );
    
    // Compute
    dftrealflat_asmjsO[ 'dftreal' + dftsize + 'flat' ]();
    
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
        throw new Error( checkname + ' failed!' );

    (passed  ||  (passed = {}))[ checkname ] = true;

}
