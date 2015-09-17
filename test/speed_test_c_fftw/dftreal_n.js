if ('undefined' !== typeof load)
{
    // V8

    load( "flatorize.js" );
    load( "flatorize_type_util.js" );
    load( "flatorize_asmjs.js" );
    load( "flatorize_d.js" );
    load( "examples.js" );
    load( "expl.js" );
    load( "expl/dftreal_flatorize.js" );
    load( "expl/asmjs_dftrealflat_check.js" );
    load( "log.js" );
    load( "speed_test.js" );
    
    // How you can load me from the base directory:
    // 
    //    load( "test/test_c_fftw/dftreal_n.js" );
    // 
    // example of use: ./dftreal1024_v8.py
}

(function () {

    var HERMIHALF = true;
    
    // Export to the global namespace

    this.dftreal_n_getCodeC                   = dftreal_n_getCodeC;
    this.dftreal_n_getCodeD                   = dftreal_n_getCodeD;
    this.dftreal_n_speed_test_flatorize       = dftreal_n_speed_test_flatorize;
    this.dftreal_n_speed_test_flatorize_asmjs = dftreal_n_speed_test_flatorize_asmjs;
    this.dftreal_n_speed_test_naive           = dftreal_n_speed_test_naive;

    // Implementation (function declarations)

    function dftreal_n_getCodeC( dftsize, /*?object?*/opt )
    {
        var precision = opt  &&  opt.precision  ||  double;
        
        var me = dftreal_n_getCodeC;

        if (!me._cO)
        {
            var hermihalf = HERMIHALF
            ,        name = 'dftreal' + dftsize + 'flat' + (hermihalf  ?  '_hermihalf'  :  '') + '_' + precision
            ;
            
            generate_small_functions();
            
            // unit test the flatorize implementation

            var ok = expl_run( expl_dftreal_flatorize, { doc_silent : true, args : [ dftsize, hermihalf ] } );
            if (!ok)
                throw new Error( 'Failed the unit test!' );

            // unit test the flatorize_asmjs implementation
            
            asmjs_dftrealflat_check( dftsize, hermihalf, opt );
            
            var name_check = 'asmjs_' + name + '_check';
            if (!passed[ name_check ])
                null.bug;
            
            // generate a C implementation
            
            var info = passed_asmjsgen_info[ name_check ];

            var c_cfg = Object.create( info.cfg );
            c_cfg.helper_h_name = name + '.h';

            me._cO = flatorize.getCodeC( c_cfg );

            // Remove functions (not interesting for JSON)
            delete me._cO.helper_h;
            delete me._cO.helper_c;
        }
        
        return me._cO;
    }


    function dftreal_n_getCodeD( dftsize, /*?object?*/opt )
    {
        var precision = opt  &&  opt.precision  ||  double;
        
        var me = dftreal_n_getCodeD;

        if (!me._cO)
        {
            var hermihalf = HERMIHALF
            ,        name = 'dftreal' + dftsize + 'flat' + (hermihalf  ?  '_hermihalf'  :  '') + '_' + precision
            ;
            
            generate_small_functions();
            
            // unit test the flatorize implementation

            var ok = expl_run( expl_dftreal_flatorize, { doc_silent : true, args : [ dftsize, hermihalf ] } );
            if (!ok)
                throw new Error( 'Failed the unit test!' );

            // unit test the flatorize_asmjs implementation
            
            asmjs_dftrealflat_check( dftsize, hermihalf, opt );
            
            var name_check = 'asmjs_' + name + '_check';
            if (!passed[ name_check ])
                null.bug;
            
            // generate a C implementation
            
            var info = passed_asmjsgen_info[ name_check ];

            var c_cfg = Object.create( info.cfg );
            c_cfg.helper_decl_name = name + '_decl.d';

            me._cO = flatorize.getCodeD( c_cfg );

            // Remove functions (not interesting for JSON)
            delete me._cO.helper_decl;
            delete me._cO.helper_d;
        }
        
        return me._cO;
    }


    function dftreal_n_speed_test_flatorize( dftsize, /*?dom node?*/button, /*?string?*/output_dom_node_id )
    {
        if (button)
            button.setAttribute( 'disabled', 'disabled' );

        var      me = dftreal_n_speed_test_flatorize
        , hermihalf = HERMIHALF
        ,      name = 'dftreal' + dftsize + 'flat' + (hermihalf  ?  '_hermihalf'  :  '') + '_double'
        ;

        // create implementation if necessary

        if (!me.dftrealflat)
        {
            generate_small_functions();

            // unit test the flatorize implementation
            var ok = expl_run( expl_dftreal_flatorize, { doc_silent : true, args : [ dftsize, hermihalf ] } );
            if (!ok)
                throw new Error( 'Failed the unit test!' );
            
            me.dftrealflat = expl_dftreal_flatorize[ name ];
            me.dftrealflat.call.a;

            // Prepare some input values

            me.input = new Array( dftsize ).join( ',' ).split( ',' ).map( Math.random );
        }

        return speed_test( {

            impl  : me.dftrealflat
            , arg : [ me.input ]
            
            , button             : button
            , output_dom_node_id : output_dom_node_id

            , mix : {
                dftsize     : dftsize
                , hermihalf : hermihalf
            }
            
            , dftsize : dftsize

        } );

    }
        
        

    function dftreal_n_speed_test_flatorize_asmjs( dftsize, /*?dom node?*/button, /*?string?*/output_dom_node_id, /*?object?*/opt )
    {
        if (button)
            button.setAttribute( 'disabled', 'disabled' );

        var      me = dftreal_n_speed_test_flatorize_asmjs
        , hermihalf = HERMIHALF
        , precision = opt  &&  opt.precision  ||  'double'
        ,      name = 'dftreal' + dftsize + 'flat' + (hermihalf  ?  '_hermihalf'  :  '') + '_' + precision
        ;

        // create implementation if necessary

        var dftrealflat_asmjsO;
        if (me.dftrealflat_asmjsO)
        {
            dftrealflat_asmjsO = me.dftrealflat_asmjsO;
        }
        else
        {
            generate_small_functions();

            // unit test the flatorize implementation
            var ok = expl_run( expl_dftreal_flatorize, { doc_silent : true, args : [ dftsize, hermihalf, opt ] } );
            if (!ok)
                throw new Error( 'Failed the unit test!' );

            // unit test the flatorize_asmjs implementation

            asmjs_dftrealflat_check( dftsize, hermihalf, opt );

            var name_check = 'asmjs_' + name + '_check';
            if (!passed[ name_check ])
                null.bug;

            // generate an asmjs implementation

            var info = passed_asmjsgen_info[ name_check ]
            , dftrealflat_asmjsGen = flatorize.getAsmjsGen( 
                info.cfg
            )
            , dftrealflat_buffer = new ArrayBuffer( dftrealflat_asmjsGen.buffer_bytes )
            , dftrealflat_asmjsO = dftrealflat_asmjsGen( this, {}, dftrealflat_buffer )
            ,                n2i = dftrealflat_asmjsGen.array_name2info
            ,         TypedArray = dftrealflat_asmjsGen.TypedArray
            ,         input_arr  = new TypedArray( dftrealflat_buffer, n2i.arr.begin_bytes,  n2i.arr.n )
            ,        output_freq = new TypedArray( dftrealflat_buffer, n2i.freq.begin_bytes, n2i.freq.n )
            ;
            dftrealflat_asmjsO[ name ].call.a;
            me.dftrealflat_asmjsO = dftrealflat_asmjsO;

            // prepare some input values
            
            input_arr.set( new Array( input_arr.length ).join(',').split(',').map( Math.random ) );
        }
        
        // speed test

        var               N = 1
        ,     one_more_time = 2
        , prev_duration_sec = 0
        ,              impl = dftrealflat_asmjsO[ name ]
        ;
        impl.call.a;
        
        return speed_test( {
            impl : impl
            , arg : []
            , button : button
            , output_dom_node_id : output_dom_node_id

            , mix : {
                dftsize     : dftsize
                , hermihalf : hermihalf
            }

            , dftsize : dftsize
        } );

    }


    
    function dftreal_n_speed_test_naive( dftsize, /*?dom node?*/button, /*?string?*/output_dom_node_id )
    {
        if (button)
            button.setAttribute( 'disabled', 'disabled' );

        var      me = dftreal_n_speed_test_naive
        , hermihalf = HERMIHALF
        ;

        // create implementation if necessary

        if (!me.dftrealflat)
        {
            generate_small_functions();

            var radix = Math.round( Math.log( dftsize ) / Math.log( 2 ) );

            me.dftrealflat = dft_msr_naive_genF( radix, { real : true, hermihalf : hermihalf } );

            // Unit test the implementation

            var  o    = get_dftreal_sin_input_output_for_check( dftsize, hermihalf )
            , freq    = me.dftrealflat( o.input )
            , error_v = flattened( freq ).map( function ( x, i ) { return Math.abs( x - this[ i ] ) }
                                               , flattened( o.expected ) )
            , error   = Math.max.apply( Math, error_v )
            ;

            if (error_v.some( isNaN )  ||  isNaN( error ))
                throw new Error( 'isNaN: DFT MSR naive implementation failed the unit test.' );

            if (error_v > 1e-9)
                throw new Error( 'Bug: DFT MSR naive implementation failed the unit test.' );
            
            // Prepare some input values

            me.input = new Array( dftsize ).join( ',' ).split( ',' ).map( Math.random );
        }

        return speed_test( {

            impl  : me.dftrealflat
            , arg : [ me.input ]
            
            , button             : button
            , output_dom_node_id : output_dom_node_id

            , mix : {
                dftsize     : dftsize
                , hermihalf : hermihalf
            }

            , dftsize : dftsize
        } );

    }
        
        
    // --- Details

    function flattened( arr )
    {
        return arr.reduce( function (a,b) { return a.concat( b ); } );
    }

    
})();
