/*global passed asmjs_complex_numbers_check matmulrows_zip_342_asmjsGen ArrayBuffer window Float32Array*/

var passed, passed_asmjsgen_info;
function asmjs_matmulrows_zip_342_check()
{
    var NAME = 'asmjs_matmulrows_zip_342_check';

    (passed  ||  (passed = {}))[ NAME ] = false;

    // "Matrix multiplication" example

    var matmulrows_zip_342        = this.matmulrows_zip_342
    , matmulrows_zip_342_asmjsGen = this.matmulrows_zip_342_asmjsGen
    ;
    if (typeof matmulrows_zip_342 === 'undefined')
    {
        expl_matmulrows_zip_flatorize();
        matmulrows_zip_342 = expl_matmulrows_zip_flatorize.matmulrows_zip_342;
    }


    var info = (passed_asmjsgen_info  ||  (passed_asmjsgen_info = {}))[ NAME ] = {
        cfg : { 
            switcher: matmulrows_zip_342
            , name: "matmulrows_zip_342" 
        } 
        , input : augment_name_value_array_with_mapping( [
            { 
                name : 'a'
                , value : [ [1,2,3,4], [5,6,7,8], [9,10,11,12] ]
            }
            , {
                name : 'b'
                , value : [ [13,14], [15,16], [17,18], [19,20] ]
            }
            
        ] )
        , output : augment_name_value_array_with_mapping( [
            {
                name    : 'c'
                , value : [[170,180],[426,452],[682,724]]
            }
        ] )
    };    


    if (typeof matmulrows_zip_342_asmjsGen === 'undefined')
        matmulrows_zip_342_asmjsGen = flatorize.getAsmjsGen( info.cfg );
    
     
    // --- Inputs and output
    var matmulrows_zip_342_buffer =
        new ArrayBuffer( matmulrows_zip_342_asmjsGen.buffer_bytes );

    // --- Compile the asm.js code
    var matmulrows_zip_342_asmjsO = matmulrows_zip_342_asmjsGen( 
        this, {}, matmulrows_zip_342_buffer 
    );

    // --- Example of use

    var      n2i = matmulrows_zip_342_asmjsGen.array_name2info
    , TypedArray = matmulrows_zip_342_asmjsGen.TypedArray
    
    // Input views

    ,   a = new TypedArray( matmulrows_zip_342_buffer, n2i.a.begin_bytes, n2i.a.n )
    ,   b = new TypedArray( matmulrows_zip_342_buffer, n2i.b.begin_bytes, n2i.b.n )

    // Output view                                  

    ,   c = new TypedArray( matmulrows_zip_342_buffer, n2i.c.begin_bytes, n2i.c.n )
    ;

    // Write input values

    set_rows( a, info.input.a );
    set_rows( b, info.input.b );

    // Compute

    matmulrows_zip_342_asmjsO.matmulrows_zip_342();
    
    // The result is accessible through `c`

    var error_v = info.output.c
        .reduce( function (a,b) { return a.concat(b); }, [] )
        .map( function (number,i) { return number - c[ i ]; } )
    
    , error = Math.max.apply( Math, error_v.map( 
        function (delta) { return Math.abs( delta ); } 
    ) )
    ;
    if (1e-10 < error)
        throw new Error( 'asmjs_matmulrows_zip_342_check failed!' );

    (passed  ||  (passed = {}))[ NAME ] = true;

    function set_rows( typedArray, rows )
    {
        typedArray.set( rows.reduce( 
            function (a,b) { return a.concat(b); }
            , [] 
        ) );
    }
}
