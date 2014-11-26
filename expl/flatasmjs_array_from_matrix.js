/*global expl_flatasmjs_array_from_matrix flatorize ArrayBuffer window passed_asmjsgen_info*/

var passed_asmjsgen_info;
function expl_flatasmjs_array_from_matrix( /*integer*/nrow, /*integer*/ncol )
// Probably not the most sumingful use(s) of flatorize (already flat)
// BUT useful as a unit test for both flatorize and flatorize+asm.js
{
    var NAME = 'expl_flatasmjs_array_from_matrix';

    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_flatasmjs_array_from_matrix;

    //#BEGIN_BODY

    var diaglen = Math.min( nrow, ncol )
    
    ,  diagflat_name = 'diagflat' + nrow + 'x' + ncol
    ,  diagflat = flatorize(
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'mat:[' + nrow + ' [' + ncol + ' double]]->diag:[' + diaglen + ' double]'
        , function ( matname )
        {
            return symbol_matrixrows( matname, nrow, ncol )
                .slice( 0, diaglen )
                .map( function ( row, i ) { return row[ i ]; } )
            ;
        }
    )
    
    , col_factor = Math.pow( 10, Math.ceil( Math.log( ncol ) / Math.log( 10 ) ) )

    ,        input = new Array( nrow ).join(',').split(',').map( 
        function ( tmp, irow ) { 
            return new Array( ncol ).join( ',' ).split( ',' ).map( 
                function ( tmp, icol ) { return irow + icol / col_factor; } 
            );
        }
    )
    ,  expected = input.slice( 0, diaglen ).map( function (row,i) { return row[ i ]; } )


    , diagflat_asmjs_name = diagflat_name + '_asmjs'

    ,  info = (passed_asmjsgen_info  ||  (passed_asmjsgen_info = {}))[ NAME ] = {
        cfg : { switcher : diagflat, name : diagflat_asmjs_name }
        , input : augment_name_value_array_with_mapping( [
            { name : 'mat',  value : input }
        ] )
        , output : augment_name_value_array_with_mapping( [
            { name : 'diag', value : expected }
        ] )
    }

    
    , diagflat_asmjs_gen = flatorize.getAsmjsGen( info.cfg )
    ;

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

    var obtained = diagflat( input );
    
    // flatorized+asm.js version
    
    var diagflat_asmjs_buffer = new ArrayBuffer( diagflat_asmjs_gen.buffer_bytes )
    ,   diagflat_asmjs_O      = diagflat_asmjs_gen( this, {}, diagflat_asmjs_buffer )  // compile
    ,   diagflat_asmjs        = diagflat_asmjs_O[ diagflat_asmjs_name ]

    ,   n2i        = diagflat_asmjs_gen.array_name2info
    ,   TypedArray = diagflat_asmjs_gen.TypedArray
   
    ,   diagflat_asmjs_input_mat   = new TypedArray( diagflat_asmjs_buffer, n2i.mat.begin_bytes,  n2i.mat.n )
    ,   diagflat_asmjs_output_diag = new TypedArray( diagflat_asmjs_buffer, n2i.diag.begin_bytes, n2i.diag.n )
    ;
    
    diagflat_asmjs_input_mat.set( input.reduce( function (a,b) { return a.concat(b); } ) );

    diagflat_asmjs();

    var obtained_asmjs = [].slice.apply( diagflat_asmjs_output_diag );
    
    //#END_BODY

    // More exports

    E[ diagflat_name ] = diagflat;

    E[ diagflat_asmjs_name ] = diagflat_asmjs;

    // For `expl_run`

    return { name : 'diagflat'
             , obtained : { flatorize : obtained
                            , flatorize_asmjs : obtained_asmjs
                          }
             
             , expected : { flatorize : expected
                            , flatorize_asmjs : expected
                          }
             , input : input 
           };
}
