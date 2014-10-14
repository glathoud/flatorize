(function () {

    var vsize = 10;

    passed.expl_scalar_from_vector = expl_run( expl_scalar_from_vector, { doc_silent : true, args : [ vsize ] } );

    passed.expl_scalar_from_matrix = expl_run( expl_scalar_from_matrix, { doc_silent : true, args : [ vsize, vsize + 3 ] } );

})();
