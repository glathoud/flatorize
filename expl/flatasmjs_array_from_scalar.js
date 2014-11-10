/*global expl_flatasmjs_array_from_scalar flatorize ArrayBuffer window*/

function expl_flatasmjs_array_from_scalar( /*integer*/size )
// Probably not the most sumingful use(s) of flatorize (already flat)
// BUT useful as a unit test for both flatorize and flatorize+asm.js
{
    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_flatasmjs_array_from_scalar;

    //#BEGIN_BODY
    
    var count_a_few_name = 'count_a_few' + size
    ,   count_a_few = flatorize(
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'n:int->v:[' + size + ' int]'
        , function ( n_name )
        {
            return empty_array( size )
                .map( function ( tmp, i ) { return flatorize.expr( n_name, '+', i ); } )
            ;
        }
    )
    
    ,   count_a_few_asmjs_name = count_a_few_name
    ,   count_a_few_asmjs_gen  = flatorize.getAsmjsGen( { switcher : count_a_few, name : count_a_few_asmjs_name } )


    ,   count_a_few_double_name = 'count_a_few_double' + size
    ,   count_a_few_double = flatorize(
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'n:double->v:[' + size + ' double]'
        , function ( n_name )
        {
            return empty_array( size )
                .map( function ( tmp, i ) { return flatorize.expr( n_name, '+', i ); } )
            ;
        }
    )
    
    ,   count_a_few_double_asmjs_name = count_a_few_double_name
    ,   count_a_few_double_asmjs_gen  = flatorize.getAsmjsGen( { switcher : count_a_few_double, name : count_a_few_double_asmjs_name } )

    ;
    
    function empty_array( size )
    {
        return new Array( size ).join( ',' ).split( ',' );
    }

    // --- Do they work?
    
    var   input = 3
    ,  expected = empty_array( size ).map( function ( tmp, i ) { return input + i; } )

    ,     input_double = 4.567
    ,  expected_double = empty_array( size ).map( function ( tmp, i ) { return input_double + i; } )
    ;
    
    // flatorized version

    var obtained = count_a_few( input )
    
    ,   obtained_double = count_a_few_double( input_double )
    ;
    
    // flatorized+asm.js version
    
    var count_a_few_asmjs_buffer = new ArrayBuffer( count_a_few_asmjs_gen.buffer_bytes )
    ,   count_a_few_asmjs_O      = count_a_few_asmjs_gen( this, {}, count_a_few_asmjs_buffer )  // compile
    ,   count_a_few_asmjs        = count_a_few_asmjs_O[ count_a_few_asmjs_name ]

    ,   n2i        = count_a_few_asmjs_gen.array_name2info
    ,   TypedArray = count_a_few_asmjs_gen.TypedArray
    
    ,   count_a_few_asmjs_output_v = new TypedArray( count_a_few_asmjs_buffer, n2i.v.begin_bytes, n2i.v.n )
    ;
    
    count_a_few_asmjs( input );

    var obtained_asmjs = [].slice.apply( count_a_few_asmjs_output_v );
    
 

    var count_a_few_double_asmjs_buffer = new ArrayBuffer( count_a_few_double_asmjs_gen.buffer_bytes )
    ,   count_a_few_double_asmjs_O      = count_a_few_double_asmjs_gen( this, {}, count_a_few_double_asmjs_buffer )  // compile
    ,   count_a_few_double_asmjs        = count_a_few_double_asmjs_O[ count_a_few_double_asmjs_name ]

    ,   n2i        = count_a_few_double_asmjs_gen.array_name2info
    ,   TypedArray = count_a_few_double_asmjs_gen.TypedArray
    
    ,   count_a_few_double_asmjs_output_v = new TypedArray( count_a_few_double_asmjs_buffer, n2i.v.begin_bytes, n2i.v.n )
    ;
    
    count_a_few_double_asmjs( input_double );

    var obtained_double_asmjs = [].slice.apply( count_a_few_double_asmjs_output_v );
    
    //#END_BODY

    // More exports

    E[ count_a_few_name ]       = count_a_few;

    E[ count_a_few_asmjs_name ] = count_a_few_asmjs;



    E[ count_a_few_double_name ]       = count_a_few_double;

    E[ count_a_few_double_asmjs_name ] = count_a_few_double_asmjs;

    // For `expl_run`

    return { name : 'count_a_few'
             , obtained : { flatorize : [ obtained, obtained_double ]
                            , flatorize_asmjs : [ obtained_asmjs, obtained_double_asmjs ]
                          }
             
             , expected : { flatorize : [ expected, expected_double ]
                            , flatorize_asmjs : [ expected, expected_double ]
                          }
             , input : input 
           };
}
