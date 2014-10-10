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

    check_error( freq, io.expected );
    
    // Sanity check: original flatorized implementation
    
    var original_flat = this[ 'dftreal' + dftsize + 'flat' ]
    ,   original_freq = original_flat( io.input )
    ;
    check_error( original_freq, io.expected );

    // Finer check on a random vector: are the two implementation
    // consistent? (Don't worry, the original one is independently
    // proofed in ./index.html).

    var random_input = new Array( dftsize ).join(',').split(',').map( Math.random )
    ,   original_output = original_flat( random_input )
    ;
    arr.set( random_input );
    dftrealflat_asmjsO[ 'dftreal' + dftsize + 'flat' ]();
    
    check_error( freq, original_output );
    
    // 

    (passed  ||  (passed = {}))[ checkname ] = true;

    // --- Details

    function check_error( obtained, expected )
    {
        var error_v = get_error( flattened( obtained ), flattened( expected ) ) 
        
        , error = Math.max.apply( Math, error_v.map( 
            function (delta) { return Math.abs( delta ); } 
        ) )
        ;
        if (1e-10 < error)
            throw new Error( checkname + ' failed!' );
    }

    function get_error( obtained_flat, expected_flat )
    {
        return expected_flat.map( function (number,i) { return number - obtained_flat[ i ]; } );
    }
    

    function flattened( an_array )
    {
        return [].reduce.call( 
            an_array
            ,function (a,b) { return a.concat(b); }
            , [] 
        );
    }
}
