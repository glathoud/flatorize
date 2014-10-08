function expl_dftreal16_flatorize()
{
    // Give external access, for example to display source code.
    // Example of use: ../index.html

    var E = expl_dftreal16_flatorize;

    //#BEGIN_BODY
    
    var power       = 4
    ,   dftsize     = 1 << power
    ,   dftrealflat = flatorize( 
        // note the :[type] declarations, ignored by `flatorize`
        // but useful later in asm.js or C contexts
        'arr:[' + dftsize + ' double]->freq:[' + dftsize + ' [2 double]]'
        , dft_exprgenF( power, { real: true } )
    )
    ;
    
    // Does this work?

    var    io = get_dftreal_sin_input_output_for_check( dftsize )
    , sinfreq = dftrealflat( io.input )
    ;
    
    //#END_BODY

    // More exports

    E[ 'dftreal' + dftsize + 'flat' ] = dftrealflat;

    // For `expl_run`

    return { name : 'sinfreq', obtained : sinfreq, expected : io.expected };
}
