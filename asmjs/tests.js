/*global load generate_small_functions ...*/

if (typeof 'load' !== 'undefined') // For non-browser environment like V8
{
    if (typeof log === 'undefined')        var log = function () {};
    if (typeof flatorize === 'undefined')  load( 'flatorize.js' );
    if (typeof generate_small_functions === 'undefined' )  load( 'examples.js' );
    if (typeof flatorize.type_util      === 'undefined' )  load( 'flatorize_type_util.js' );
    if (typeof flatorize.getAsmjsGen    === 'undefined' )  load( 'flatorize_asmjs.js' );
    if (typeof dft_msr_exprgenF         === 'undefined' )  load( 'modifsplitradix.js' );

    if (typeof expl_run                 === 'undefined' )  load( 'expl.js' );

    if (typeof expl_matmulrows_zip_flatorize           === 'undefined')  load( 'expl/matmulrows_zip_flatorize.js' );
    if (typeof expl_dftreal_flatorize                  === 'undefined')  load( 'expl/dftreal_flatorize.js' );
    if (typeof asmjs_complex_numbers_check             === 'undefined')  load( 'expl/asmjs_complex_numbers_check.js' );
    if (typeof asmjs_complex_numbers_check_direct      === 'undefined')  load( 'expl/asmjs_complex_numbers_check_direct.js' );
    if (typeof asmjs_matmulrows_zip_342_check          === 'undefined')  load( 'expl/asmjs_matmulrows_zip_342_check.js' );
    if (typeof asmjs_dftrealflat_check                 === 'undefined')  load( 'expl/asmjs_dftrealflat_check.js' );
    if (typeof expl_flatasmjs_scalar_from_scalar       === 'undefined')  load( 'expl/flatasmjs_scalar_from_scalar.js' );
    if (typeof expl_flatasmjs_scalar_from_array        === 'undefined')  load( 'expl/flatasmjs_scalar_from_array.js' );
    if (typeof expl_flatasmjs_scalar_from_matrix       === 'undefined')  load( 'expl/flatasmjs_scalar_from_matrix.js' );
    if (typeof expl_flatasmjs_scalar_from_ndim         === 'undefined')  load( 'expl/flatasmjs_scalar_from_ndim.js' );
    if (typeof expl_flatasmjs_array_from_scalar        === 'undefined')  load( 'expl/flatasmjs_array_from_scalar.js' );
    if (typeof expl_flatasmjs_array_from_array         === 'undefined')  load( 'expl/flatasmjs_array_from_array.js' );
    if (typeof expl_flatasmjs_array_from_matrix        === 'undefined')  load( 'expl/flatasmjs_array_from_matrix.js' );
    if (typeof expl_flatasmjs_array_from_ndim          === 'undefined')  load( 'expl/flatasmjs_array_from_ndim.js' );
    if (typeof expl_flatasmjs_matrix_from_scalar       === 'undefined')  load( 'expl/flatasmjs_matrix_from_scalar.js' );
    if (typeof expl_flatasmjs_matrix_from_array        === 'undefined')  load( 'expl/flatasmjs_matrix_from_array.js' );
    if (typeof expl_flatasmjs_matrix_from_matrix       === 'undefined')  load( 'expl/flatasmjs_matrix_from_matrix.js' );
    if (typeof expl_flatasmjs_ndim_from_ndim           === 'undefined')  load( 'expl/flatasmjs_ndim_from_ndim.js' );
    if (typeof expl_flatasmjs_scalarint_from_scalardouble === 'undefined')  load( 'expl/flatasmjs_scalarint_from_scalardouble.js' );
}

generate_small_functions();

(function () {

    asmjs_complex_numbers_check();
    asmjs_complex_numbers_check_direct();
    asmjs_matmulrows_zip_342_check();

    asmjs_dftrealflat_check( 8 );

    asmjs_dftrealflat_check( 16 );

    // xxx still an issue with some gcc -> memory usage explodes
    if ('undefined' === typeof document  &&  'undefined' === typeof window)
        asmjs_dftrealflat_check( 1024 );  // Too slow - not in the browser
        

    var vsize = 10;

    passed.expl_flatasmjs_scalar_from_scalar = expl_run( expl_flatasmjs_scalar_from_scalar, { doc_silent : true, args : [ ] } );

    passed.expl_flatasmjs_scalar_from_array = expl_run( expl_flatasmjs_scalar_from_array, { doc_silent : true, args : [ vsize ] } );

    passed.expl_flatasmjs_scalar_from_matrix = expl_run( expl_flatasmjs_scalar_from_matrix, { doc_silent : true, args : [ vsize, vsize + 3 ] } );

    passed.expl_flatasmjs_scalar_from_ndim_2 = expl_run( expl_flatasmjs_scalar_from_ndim, { doc_silent : true, args : [ [ vsize, vsize + 3 ] ] } );

    passed.expl_flatasmjs_scalar_from_ndim_3 = expl_run( expl_flatasmjs_scalar_from_ndim, { doc_silent : true, args : [ [ 4, 5, 3 ] ] } );

    passed.expl_flatasmjs_scalar_from_ndim_4 = expl_run( expl_flatasmjs_scalar_from_ndim, { doc_silent : true, args : [ [ 5, 4, 3, 2 ] ] } );


    passed.expl_flatasmjs_array_from_scalar = expl_run( expl_flatasmjs_array_from_scalar, { doc_silent : true, args : [ vsize ] } );

    passed.expl_flatasmjs_array_from_array = expl_run( expl_flatasmjs_array_from_array, { doc_silent : true, args : [ vsize ] } );

    passed.expl_flatasmjs_array_from_matrix = expl_run( expl_flatasmjs_array_from_matrix, { doc_silent : true, args : [ vsize, vsize + 3 ] } );

    passed.expl_flatasmjs_array_from_ndim_2 = expl_run( expl_flatasmjs_array_from_ndim, { doc_silent : true, args : [ [ vsize, vsize + 3 ] ] } );

    passed.expl_flatasmjs_array_from_ndim_3 = expl_run( expl_flatasmjs_array_from_ndim, { doc_silent : true, args : [ [ 5, 4, 3 ] ] } );

    passed.expl_flatasmjs_array_from_ndim_4 = expl_run( expl_flatasmjs_array_from_ndim, { doc_silent : true, args : [ [ 4, 5, 3, 2 ] ] } );


    passed.expl_flatasmjs_matrix_from_scalar = expl_run( expl_flatasmjs_matrix_from_scalar, { doc_silent : true, args : [ vsize, vsize + 3 ] } );

    passed.expl_flatasmjs_matrix_from_array = expl_run( expl_flatasmjs_matrix_from_array, { doc_silent : true, args : [ vsize ] } );

    passed.expl_flatasmjs_matrix_from_matrix = expl_run( expl_flatasmjs_matrix_from_matrix, { doc_silent : true, args : [ vsize, vsize + 3 ] } );

    passed.expl_flatasmjs_matrix_from_ndim_3 = expl_run( expl_flatasmjs_ndim_from_ndim, { doc_silent : true, args : [ [ 5, 4, 3 ], [ 6, 10 ] ] } );

    passed.expl_flatasmjs_matrix_from_ndim_4 = expl_run( expl_flatasmjs_ndim_from_ndim, { doc_silent : true, args : [ [ 5, 4, 3, 2 ], [ 12, 10 ] ] } );


    passed.expl_flatasmjs_ndim_3_from_array = expl_run( expl_flatasmjs_ndim_from_ndim, { doc_silent : true, args : [ [ 60 ], [ 5, 4, 3 ] ] } );

    passed.expl_flatasmjs_ndim_3_from_matrix = expl_run( expl_flatasmjs_ndim_from_ndim, { doc_silent : true, args : [ [ 30, 2 ], [ 5, 4, 3 ] ] } );

    passed.expl_flatasmjs_ndim_4_from_array = expl_run( expl_flatasmjs_ndim_from_ndim, { doc_silent : true, args : [ [ 120 ], [ 5, 4, 3, 2 ] ] } );

    passed.expl_flatasmjs_ndim_4_from_matrix = expl_run( expl_flatasmjs_ndim_from_ndim, { doc_silent : true, args : [ [ 4, 30 ], [ 5, 4, 3, 2 ] ] } );

    passed.expl_flatasmjs_ndim_4_from_ndim_3 = expl_run( expl_flatasmjs_ndim_from_ndim, { doc_silent : true, args : [ [ 5, 12, 2 ], [ 5, 4, 3, 2 ] ] } );

    // Cast tests

    passed.expl_flatasmjs_scalarint_from_scalardouble = expl_run( expl_flatasmjs_scalarint_from_scalardouble, { doc_silent : true, args : [ ] } );

})();
