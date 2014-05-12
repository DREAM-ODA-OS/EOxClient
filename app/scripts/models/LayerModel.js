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

	root.define([
		'backbone'
	],

	function( Backbone ) { // initializer

		var LayerModel = Backbone.Model.extend({
			name: '',
			description: null,
			timeSlider: false,
			timeSliderProtocol: '',
			color: "",
			time: null,
			visible: null,
			opacity: 0,
			view: {
				id : '',
				protocol: '',
				urls : [],
				style: 'default',
				isBaseLayer: null,
				attribution: '',
				matrixSet: '',
				format: '',
				resolutions: [],
				maxExtent: [],
				projection: '',
				gutter: null,
				buffer: null,
				units: '',
				transitionEffect: '',
				isphericalMercator: null,
				wrapDateLine: null,
				zoomOffset: null,
				requestEncoding: 'KVP',
				// extraLayers: optional key-value store of extra layers such as
				//              {'outlines':'xy_outlines','cloudMask':'xy_clouds','masked':'yx_masked' ...}
				extraLayers: {}
			},

			download: {
				id : '',
				protocol: '',
				url : '',
			},

            info: {
                id: null,
                protocol: null,
                url: null
            }
			
		});

		return {"LayerModel":LayerModel};
	});

	

}).call( this );
