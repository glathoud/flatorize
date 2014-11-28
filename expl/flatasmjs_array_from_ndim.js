/*global expl_flatasmjs_array_from_ndim flatorize ArrayBuffer window passed_asmjsgen_info*/

var passed_asmjsgen_info;
function expl_flatasmjs_array_from_ndim( /*array of integer*/dim )
// Maybe not the most meaningful use of flatorize, but a good unit
// test for both flatorize and flatorize+asm.js
{
    var NAME = 'expl_flatasmjs_array_from_ndim_' + dim.length;
    
    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_flatasmjs_array_from_ndim;

    //#BEGIN_BODY

    var ndimdiaglen = Math.min.apply( Math, dim )
    
    ,  ndimdiagflat_name = 'ndimdiagflat' + dim.join( 'x' )
    ,  ndimdiagflat = flatorize(
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'mat:'  + dim2spec( dim, 'double' ) + '->ndimdiag:[' + ndimdiaglen + ' double]'
        , function ( matname )
        {
            return !(ndimdiaglen > 0)
                ?  []
                :  ndim_diag(
                    symbol_ndim_matrix( matname, dim )
                    , dim
                    , ndimdiaglen
                )
            ;
        }
    )
    
    , ndimdiagflat_asmjs_name = ndimdiagflat_name + '_asmjs'

    ,     input = random_ndim_matrix( dim )
    ,  expected = new Array( ndimdiaglen )
    ;
    for (var i = ndimdiaglen; i--;)
    {
        var tmp = input;
        for (var id = dim.length; id--;)
            tmp = tmp[ i ];
        
        expected[ i ] = tmp;
    }
    
    var info = (passed_asmjsgen_info  ||  (passed_asmjsgen_info = {}))[ NAME ] = {
        cfg : { switcher : ndimdiagflat, name : ndimdiagflat_asmjs_name }
        , input : augment_name_value_array_with_mapping( [
            { name : 'mat',  value : input }
        ] )
        , output : augment_name_value_array_with_mapping( [
            { name : 'ndimdiag', value : expected }
        ] )
    }

    , ndimdiagflat_asmjs_gen = flatorize.getAsmjsGen( info.cfg )
    ;

    function dim2spec( /*array of integer*/dim, /*string*/basic_type )
    {
        (basic_type || null).substring.call.a;
        return dim.length > 0
            ?  '[' + dim[ 0 ] + ' ' + dim2spec( dim.slice( 1 ), basic_type ) + ']'
            :  basic_type
        ;
    }

    function ndim_diag( mat, dim, ndimdiaglen )
    {
        (ndimdiaglen  ||  null).toPrecision.call.a;
        return empty_array( ndimdiaglen ).map( one_term_of_the_diag );

        function one_term_of_the_diag( tmp, i )
        {
            return dim.reduce( function ( what, tmp ) { return what[ i ]; }
                               , mat 
                             );
        }
    }

    function symbol_ndim_matrix( /*string | object*/what, /*array of integer*/dim )
    // 2-dimensional example:
    // 
    // m := [ [ m[0][0], m[0][1], m[0][2], ... ], 
    //        [ m[1][0], m[1][1], m[1][2], ... ], 
    //        ... 
    //      ]
    {
        return !(dim.length > 0)

            ?  what
        
            :  empty_array( dim[ 0 ] ).map( function ( tmp, a ) {

                return symbol_ndim_matrix( flatorize.part( what, a ), dim.slice( 1 ) );
            })
        ;
    }

    function empty_array( size )
    {
        return new Array( size ).join( ',' ).split( ',' );
    }
    
    // --- Do they work?

    function random_ndim_matrix( dim )
    {
        return !(dim.length > 0)
            ?  Math.random()
            :  empty_array( dim[ 0 ] ).map( 
                function () { return random_ndim_matrix( dim.slice( 1 ) ); }
            );
    }
    
    function flatten_values( /*array*/ndim_mat )
    {
        return ndim_mat[ 0 ] instanceof Array
            ?  ndim_mat.reduce( function ( a, b ) { return a.concat( flatten_values( b ) ); }, [] )
        :  ndim_mat
        ;
    }


    // flatorized version

    var obtained = ndimdiagflat( input );
    
    // flatorized+asm.js version
    
    var ndimdiagflat_asmjs_buffer = new ArrayBuffer( ndimdiagflat_asmjs_gen.buffer_bytes )
    ,   ndimdiagflat_asmjs_O      = ndimdiagflat_asmjs_gen( this, {}, ndimdiagflat_asmjs_buffer )  // compile
    ,   ndimdiagflat_asmjs        = ndimdiagflat_asmjs_O[ ndimdiagflat_asmjs_name ]

    ,   n2i        = ndimdiagflat_asmjs_gen.array_name2info
    ,   TypedArray = ndimdiagflat_asmjs_gen.TypedArray
   
    ,   ndimdiagflat_asmjs_input_mat       = new TypedArray( ndimdiagflat_asmjs_buffer, n2i.mat.begin_bytes,      n2i.mat.n )
    ,   ndimdiagflat_asmjs_output_ndimdiag = new TypedArray( ndimdiagflat_asmjs_buffer, n2i.ndimdiag.begin_bytes, n2i.ndimdiag.n )
    ;
    
    ndimdiagflat_asmjs_input_mat.set( flatten_values( input ) );
    
    ndimdiagflat_asmjs();

    var obtained_asmjs = [].slice.apply( ndimdiagflat_asmjs_output_ndimdiag );
    
    //#END_BODY

    // More exports

    E[ ndimdiagflat_name ] = ndimdiagflat;

    E[ ndimdiagflat_asmjs_name ] = ndimdiagflat_asmjs;

    // For `expl_run`

    return { name : 'ndimdiagflat'
             , obtained : { flatorize : obtained
                            , flatorize_asmjs : obtained_asmjs
                          }
             
             , expected : { flatorize : expected
                            , flatorize_asmjs : expected
                          }
             , input : input 
           };
}
