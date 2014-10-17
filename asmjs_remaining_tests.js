(function () {

    var vsize = 10;

    passed.expl_flatasmjs_scalar_from_scalar = expl_run( expl_flatasmjs_scalar_from_scalar, { doc_silent : true, args : [ ] } );

    passed.expl_flatasmjs_scalar_from_array = expl_run( expl_flatasmjs_scalar_from_array, { doc_silent : true, args : [ vsize ] } );

    passed.expl_flatasmjs_scalar_from_matrix = expl_run( expl_flatasmjs_scalar_from_matrix, { doc_silent : true, args : [ vsize, vsize + 3 ] } );


    passed.expl_flatasmjs_array_from_scalar = expl_run( expl_flatasmjs_array_from_scalar, { doc_silent : true, args : [ vsize ] } );

    passed.expl_flatasmjs_array_from_array = expl_run( expl_flatasmjs_array_from_array, { doc_silent : true, args : [ vsize ] } );

    passed.expl_flatasmjs_array_from_matrix = expl_run( expl_flatasmjs_array_from_matrix, { doc_silent : true, args : [ vsize, vsize + 3 ] } );


    passed.expl_flatasmjs_matrix_from_scalar = expl_run( expl_flatasmjs_matrix_from_scalar, { doc_silent : true, args : [ vsize, vsize + 3 ] } );

    passed.expl_flatasmjs_matrix_from_array = expl_run( expl_flatasmjs_matrix_from_array, { doc_silent : true, args : [ vsize ] } );

    passed.expl_flatasmjs_matrix_from_matrix = expl_run( expl_flatasmjs_matrix_from_matrix, { doc_silent : true, args : [ vsize, vsize + 3 ] } );

})();
