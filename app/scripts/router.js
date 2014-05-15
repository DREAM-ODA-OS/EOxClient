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

	var root = this;

	root.require([
		'app',
		'backbone',
		'communicator',
		'backbone.marionette'
	],

	function( App, Backbone, Communicator ) {

		App.addInitializer(function (options) {
            //Create a new Router
            App.router = new Router();
            //start history
            Backbone.history.start({pushState: false});
        });


		var Router = Backbone.Marionette.AppRouter.extend({
			initialize: function(options) {

				this.listenTo(Communicator.mediator, "router:setUrl", this.setUrl);
			},

            setUrl: function(data){
                // number of digits after the decimal point
                var ndec = 4 ;

                var urlFragment = 'map'+
                    '/'+(data.center.lon).toFixed(ndec)+
                    '/'+(data.center.lat).toFixed(ndec)+
                    '/'+data.zoomLevel ;

                if(data.time) {
                    urlFragment += '/'+getISODateTimeString(data.time.start)+
                                   '/'+getISODateTimeString(data.time.end) ;
                }

                App.router.navigate(urlFragment,{trigger:false});
            },

            routes : {
                'map/:x/:y/:l' : 'setSpatExt',
                'map/:x/:y/:l/:s/:e' : 'setSpatTempExt'
            },

            setSpatExt : function(lon,lat,level){
                // set spatial map extent

                function _mod360(x) { return x - Math.floor((x+180.0)/360.0)*360.0 ; }

                // parse the number inputs
                var mc = {
                    lon : _mod360(parseFloat(lon)),
                    lat : Math.max(-90.0,Math.min(+90.0,parseFloat(lat))),
                    zoomLevel : Math.max(0,parseInt(level))
                }

                if ( isNaN(mc.lon) || isNaN(mc.lat) || isNaN(level) )
                {
                    console.error('Invalid map center: LAT='+lon+', LON='+lat+', LEVEL='+level);
                    return ;
                }

                // set spatio-temporal extent
                Communicator.mediator.trigger('map:center', mc);
            },

            setSpatTempExt : function(lon,lat,level,start,end){
                // set spatio-temporal map extent

                this.setSpatExt(lon,lat,level)

                // parse time
                var _start = Date.parse(start) ;
                var _end = Date.parse(end) ;

                if ( isNaN(_start) || isNaN(_end) ) {
                    console.error('Invalid map time-extent: START='+start+', END='+end);
                    return ;
                }

                // set temporal extent
                Communicator.mediator.trigger('date:selection:change', {
                    start: new Date(_start),
                    end: new Date(_end)
                });
            }
		});

		return Router;
	});
}).call( this);


