//-------------------------------------------------------------------------------
//
// Project: EOxClient <https://github.com/EOX-A/EOxClient>
// Authors: Daniel Santillan <daniel.santillan@eox.at>
//
//-------------------------------------------------------------------------------
// Copyright (C) 2014 EOX IT Services GmbH
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies of this Software or works derived from this Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//-------------------------------------------------------------------------------

(function() {
    'use strict';

    var root = this; // to be used in nested context

    function setuplogging (enable) {

    	// Check if console exists (difference in browsers and if it is enabled)
    	if (!enable || typeof console === 'undefined' || !console.log ) {
		  window.console = {
		    debug: function() {},
		    trace: function() {},
		    log: function() {},
		    info: function() {},
		    warn: function() {},
		    error: function() {}
		  };
		}
    	
    }

    // assure all required JS modules + the configuration are available 
    // ... and trigger the main app's setup 
    root.require([
		'backbone',
        'app',                  // the main app
        'backbone.marionette',
        'regionManager',
        'jquery',
        'jqueryui',
        "util",                 // variaous utilities
        "libcoverage",          // WCS handling code
        "text!../config.json"   // static configuration file
	],
	function ( Backbone, App ) {
		$.get("config.json", function(config_src) {
			
			// load the data content specification
            $.get(config_src.mapConfig.dataconfigurl, function(data_cfg) {

                _.extend(config_src.mapConfig, data_cfg);
            });

            // Configure Debug options
            setuplogging(config_src.debug);

            var viewModules = [];
            var models = [];
            var templates = [];
            var options = {};
            var config = {};

            // collect list of view modules
            _.each(config_src.views, function(view) {
                viewModules.push(view);
            }, this);

            // collect list of model modules
            _.each(config_src.models, function(model) {
                models.push(model);
            }, this);

            // collect list of template modules
            _.each(config_src.templates, function(tmpl) {
                templates.push(tmpl.template);
            }, this);

            // assure all required modules are available and start the main app
            root.require([].concat(
                config_src.mapConfig.visualizationLibs,     //Visualizations such as Openlayers or GlobWeb
                config_src.mapConfig.module,                //Which module should be used for map visualization
                config_src.mapConfig.model,                 //Which model to use for saving map data
                viewModules,                            //All "activated" views are loaded
                models,
                templates
            ), function(){
                App.configure(config_src);
                App.start();
            });

        });
        
    });
}).call( this );