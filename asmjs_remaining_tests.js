(function () {

    var vsize = 10;

    passed.expl_flatasmjs_scalar_from_scalar = expl_run( expl_flatasmjs_scalar_from_scalar, { doc_silent : true, args : [ ] } );

    passed.expl_flatasmjs_scalar_from_vector = expl_run( expl_flatasmjs_scalar_from_vector, { doc_silent : true, args : [ vsize ] } );

    passed.expl_flatasmjs_scalar_from_matrix = expl_run( expl_flatasmjs_scalar_from_matrix, { doc_silent : true, args : [ vsize, vsize + 3 ] } );


    passed.expl_flatasmjs_vector_from_scalar = expl_run( expl_flatasmjs_vector_from_scalar, { doc_silent : true, args : [ vsize ] } );

    passed.expl_flatasmjs_vector_from_vector = expl_run( expl_flatasmjs_vector_from_vector, { doc_silent : true, args : [ vsize ] } );

    passed.expl_flatasmjs_vector_from_matrix = expl_run( expl_flatasmjs_vector_from_matrix, { doc_silent : true, args : [ vsize, vsize + 3 ] } );


    passed.expl_flatasmjs_matrix_from_scalar = expl_run( expl_flatasmjs_matrix_from_scalar, { doc_silent : true, args : [ vsize, vsize + 3 ] } );

    passed.expl_flatasmjs_matrix_from_vector = expl_run( expl_flatasmjs_matrix_from_vector, { doc_silent : true, args : [ vsize ] } );

    passed.expl_flatasmjs_matrix_from_matrix = expl_run( expl_flatasmjs_matrix_from_matrix, { doc_silent : true, args : [ vsize, vsize + 3 ] } );

})();
