/*global expl_flatasmjs_matrix_from_matrix flatorize ArrayBuffer window passed_asmjsgen_info*/

var passed_asmjsgen_info;
function expl_flatasmjs_matrix_from_matrix( /*integer*/nrow, /*integer*/ncol )
// Probably not the most sumingful use(s) of flatorize (already flat)
// BUT useful as a unit test for both flatorize and flatorize+asm.js
{
    var NAME = 'expl_flatasmjs_matrix_from_matrix';

    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_flatasmjs_matrix_from_matrix;

    //#BEGIN_BODY

    var transpose_name = 'transpose'
    ,   transpose      = flatorize(
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'mat:[' + nrow + ' [' + ncol + ' double]]->tmat:[' + ncol + ' [' + nrow + ' double]]'
        , function ( matname )
        {
            return zip.apply( null, symbol_matrixrows( matname, nrow, ncol ) );
        }
    )
    

    ,   col_factor = Math.pow( 10, Math.ceil( Math.log( ncol ) / Math.log( 10 ) ) )
    
    ,        input = empty_array( nrow ).map( 
        function ( tmp, irow ) { 
            return empty_array( ncol ).map( 
                function ( tmp, icol ) { return irow + icol / col_factor; } 
            );
        }
    )

    ,     expected = empty_array( ncol ).map( 
        function ( tmp, icol ) { 
            return empty_array( nrow ).map( 
                function ( tmp, irow ) { return irow + icol / col_factor; } 
            );
        }
    )
        

    ,   transpose_asmjs_name = transpose_name + '_asmjs'


    ,   info = (passed_asmjsgen_info  ||  (passed_asmjsgen_info = {}))[ NAME ] = {
        
        cfg : { switcher : transpose, name : transpose_asmjs_name }

        , input : augment_name_value_array_with_mapping( [
            { name : 'mat',  value : input }
        ] )

        , output : augment_name_value_array_with_mapping( [
            { name : 'tmat', value : expected }
        ] )
    }


    ,   transpose_asmjs_gen  = flatorize.getAsmjsGen( info.cfg )
    ;

    function zip(/*...arguments...*/)
    {
        var arg = [].slice.apply( arguments );
        if (!arg.length)
            return [];
        
        var n = arg[ 0 ].length
        , ret = new Array( n )
        ;
        for (var i = 0; i < n; i++)
            ret[ i ] = arg.map( function (x) { return x[i]; } );
        
        return ret;
    }
    
    function symbol_matrixrows( name, nrow, ncol )
    // m := [ [ m[0][0], m[0][1], m[0][2], ... ], 
    //        [ m[1][0], m[1][1], m[1][2], ... ], 
    //        ... 
    //      ]
    {
        return empty_array( nrow ).map( function ( tmp, r ) {

            return empty_array( ncol ).map( function ( tmp, c ) {

                return flatorize.part( flatorize.part( name, r ), c ); // e.g. m[r][c]
            });
        });
    }

    function empty_array( size )
    {
        return new Array( size ).join( ',' ).split( ',' );
    }
        
    // --- Do they work?

    // flatorized version

    var obtained = transpose( input );
    
    // flatorized+asm.js version
    
    var transpose_asmjs_buffer = new ArrayBuffer( transpose_asmjs_gen.buffer_bytes )
    ,   transpose_asmjs_O      = transpose_asmjs_gen( this, {}, transpose_asmjs_buffer )  // compile
    ,   transpose_asmjs        = transpose_asmjs_O[ transpose_asmjs_name ]

    ,   n2i        = transpose_asmjs_gen.array_name2info
    ,   TypedArray = transpose_asmjs_gen.TypedArray
   
    ,   transpose_asmjs_input_mat   = new TypedArray( transpose_asmjs_buffer, n2i.mat.begin_bytes,  n2i.mat.n )
    ,   transpose_asmjs_output_tmat = new TypedArray( transpose_asmjs_buffer, n2i.tmat.begin_bytes, n2i.tmat.n )
    ;
    
    transpose_asmjs_input_mat.set( input.reduce( function (a,b) { return a.concat(b); } ) );

    transpose_asmjs();

    var obtained_asmjs = [].slice.apply( transpose_asmjs_output_tmat );
    
    //#END_BODY

    // More exports

    E[ transpose_name ] = transpose;

    E[ transpose_asmjs_name ] = transpose_asmjs;

    // For `expl_run`

    return { name : 'transpose'
             , obtained : { flatorize : obtained
                            , flatorize_asmjs : obtained_asmjs
                          }
             
             , expected : { flatorize : expected
                            , flatorize_asmjs : expected.reduce( function (a,b) { return a.concat(b); } )
                          }
             , input : input 
           };
}
