/*global passed asmjs_complex_numbers_check matmulrows_zip_342_asmjsGen ArrayBuffer window Float32Array*/

var passed, passed_asmjsgen_info;
function asmjs_dftrealflat_check( /*integer, e.g. 16 or 1024*/dftsize )
{
    var NAME = 'asmjs_dftreal' + dftsize + 'flat_check';

    (passed  ||  (passed = {}))[ NAME ] = false;

    // "DFT REAL" example

    var NAME_FLAT     = 'dftreal' + dftsize + 'flat'
    ,   NAME_ASMJSGEN = NAME_FLAT + '_asmjsGen'

    ,   dftrealflat          = this[ NAME_FLAT ]
    ,   dftrealflat_asmjsGen = this[ NAME_ASMJSGEN ]
    ;
    if (typeof dftrealflat === 'undefined')
    {
        expl_dftreal_flatorize( dftsize );       
        dftrealflat = expl_dftreal_flatorize[ NAME_FLAT ];
    }

    var io = get_dftreal_sin_input_output_for_check( dftsize );
    
    var info = (passed_asmjsgen_info  ||  (passed_asmjsgen_info = {}))[ NAME ] = {
        cfg : { 
                switcher: dftrealflat
                , name: "dftreal" + dftsize + "flat" 
            } 
        , input : augment_name_value_array_with_mapping( [
            { 
                name : "arr"
                , value : io.input 
            }
        ] )
        , output : augment_name_value_array_with_mapping( [
            {
                name    : 'freq'
                , value : io.expected
            }
        ] )
    };    

    if (typeof dftrealflat_asmjsGen === 'undefined')
    {
        var dftrealflat_asmjsGen = flatorize.getAsmjsGen( 
            info.cfg
        );
    }
    
    // --- Inputs and output
    
    var dftrealflat_buffer = 
        new ArrayBuffer( dftrealflat_asmjsGen.buffer_bytes )
    ;

    // --- Compile the asm.js code
    var dftrealflat_asmjsO = dftrealflat_asmjsGen( 
        this, {}, dftrealflat_buffer 
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

    arr.set( info.input.arr );
    
    // Compute

    //#COMPUTE_BEGIN
    dftrealflat_asmjsO[ 'dftreal' + dftsize + 'flat' ]();
    //#COMPUTE_END
    
    // The result is accessible through `freq`

    check_error( freq, info.output.freq );
    
    // Sanity check: original flatorized implementation
    
    var original_freq = dftrealflat( info.input.arr );
    check_error( original_freq, info.output.freq );

    // Finer check on a random vector: are the two implementation
    // consistent? (Don't worry, the original one is independently
    // proofed in ./index.html).

    var random_input = new Array( dftsize ).join(',').split(',').map( Math.random )
    ,   original_output = dftrealflat( random_input )
    ;
    arr.set( random_input );
    dftrealflat_asmjsO[ 'dftreal' + dftsize + 'flat' ]();
    
    check_error( freq, original_output );
    
    // 

    (passed  ||  (passed = {}))[ NAME ] = true;

    // --- Details

    function check_error( obtained, expected )
    {
        var error_v = get_error( flattened( obtained ), flattened( expected ) ) 
        
        , error = Math.max.apply( Math, error_v.map( 
            function (delta) { return Math.abs( delta ); } 
        ) )
        ;
        if (1e-10 < error)
            throw new Error( NAME + ' failed!' );
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
