/*global passed asmjs_complex_numbers_check_direct f2_asmjsGen_direct ArrayBuffer window Float32Array*/

var passed, passed_asmjsgen_info, f2_asmjsGen_direct;
function asmjs_complex_numbers_check_direct()
{
    var NAME = 'asmjs_complex_numbers_check_direct';

    (passed  ||  (passed = {}))[ NAME ] = false;

    // "Complex numbers" example

    var info = (passed_asmjsgen_info  ||  (passed_asmjsgen_info = {}))[ NAME ] = {
        cfg : { 
            name      : 'f2'
            , varstr  : 'a:[2 float],b:[2 float],c:[2 float]->d:[2 float]'
            , exprgen : f2.exprgen 
        }
        , input : augment_name_value_array_with_mapping( [
            { name : "a",   value : [1.2, -3.4] }
            , { name : "b", value : [0,   1]    }
            , { name : "c", value : [-1,  9.99] }
        ] )
        , output : augment_name_value_array_with_mapping( [
            {
                name    : 'd'
                , value : [
                    1.2  - 2*(0 + -1)
                    , -3.4 - 2*(1 + 9.99)
                ]
            }
        ] )
    };    

    if (typeof f2_asmjsGen_direct === 'undefined')
        f2_asmjsGen_direct = flatorize.getAsmjsGen( info.cfg );
    
    // --- Inputs and output
    var f2_buffer = new ArrayBuffer( f2_asmjsGen_direct.buffer_bytes );

    // --- Compile the asm.js code

    var f2_asmjsO = f2_asmjsGen_direct( this, {}, f2_buffer );

    // --- Example of use
    // Input views
    var         n2i = f2_asmjsGen_direct.array_name2info
    ,    TypedArray = f2_asmjsGen_direct.TypedArray

    ,   a = new TypedArray( f2_buffer, n2i.a.begin_bytes, n2i.a.n )
    ,   b = new TypedArray( f2_buffer, n2i.b.begin_bytes, n2i.b.n )
    ,   c = new TypedArray( f2_buffer, n2i.c.begin_bytes, n2i.c.n )
    // Output view                                  
    ,   d = new TypedArray( f2_buffer, n2i.d.begin_bytes, n2i.d.n )
    ;

    // Write input values
    a.set( info.input.a );
    b.set( info.input.b );
    c.set( info.input.c );

    // Compute
    f2_asmjsO.f2();

    
    // The result is accessible through `d`
    var error_v = [
        d[ 0 ]   - info.output.d[ 0 ]
        , d[ 1 ] - info.output.d[ 1 ]
    ]
    , error = Math.max.apply( Math, error_v.map( 
        function (delta) { return Math.abs( delta ); } 
    ) )
    ;
    if (1e-4 < error)
        throw new Error( NAME + ' failed!' );

    (passed  ||  (passed = {}))[ NAME ] = true;
}
