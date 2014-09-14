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
		'backbone',
		'd3'
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
            layers: null, // comma separated list of the currently displayed layers - defaults to the `view.id`
            show_outlines: null, // display outlines for the product layers
            strip_clouds: null, // make cloud covered areas trasparent
            show_cloud_mask: null, // display cloud mask
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
				//              {'outlines':'xy_outlines','cloudMask':'xy_cloud','masked':'yx_masked' ...}
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

		}); /* end of Backbone.Model.extend() */

        var autoColor = {
            colors : d3.scale.category10(),
            index : 0,
            getColor: function () { return this.colors(this.index++) }
        }

        function parseProductLayer(obj) {

            if (! obj.info ) { obj.info = {}; }

            var is_wms = ( obj.view.protocol == 'WMS' )

            // parse extra wms layers
            var extraLayers = {};
            if ( obj.view.extraLayers && typeof obj.view.extraLayers == 'object' ) {
                extraLayers = _.extend({},obj.view.extraLayers);
            }

            return new LayerModel({
                name: obj.name,
                description: (obj.description ? obj.description: null),
                visible: obj.visible,
                layers: obj.view.id,
                show_outlines: false,
                strip_clouds: false,
                show_cloud_mask: false,
                timeSlider: obj.timeSlider,
                // Default to WMS if no protocol is defined (allowed protocols: WMS|EOWCS|WPS)
                timeSliderProtocol: obj.timeSliderProtocol ? obj.timeSliderProtocol : 'WMS',
                color:  obj.color ? obj.color : autoColor.getColor() ,
                time: obj.time,
                opacity: 1,
                view:{
                    id : obj.view.id,
                    protocol: obj.view.protocol,
                    urls : obj.view.urls,
                    visualization: obj.view.visualization,
                    projection: obj.view.projection,
                    attribution: obj.view.attribution,
                    matrixSet: obj.view.matrixSet,
                    style: obj.view.style,
                    format: obj.view.format,
                    resolutions: obj.view.resolutions,
                    maxExtent: obj.view.maxExtent,
                    gutter: obj.view.gutter,
                    buffer: obj.view.buffer,
                    units: obj.view.units,
                    transitionEffect: obj.view.transitionEffect,
                    isphericalMercator: obj.view.isphericalMercator,
                    isBaseLayer: false,
                    wrapDateLine: obj.view.wrapDateLine,
                    zoomOffset: obj.view.zoomOffset,
                    requestEncoding: obj.view.requestEncoding,
                    extraLayers: extraLayers
                },
                download: {
                    id : obj.download.id,
                    protocol: obj.download.protocol,
                    url : obj.download.url,
                    rectified: ( obj.rectified != null ? obj.rectified : true )
                },
                info: {
                    // NOTE: If the wiew protocol is WMS info default to getFeatureInfo()
                    //       on the same layer.
                    id: obj.info.id ? obj.info.id : ( is_wms ? obj.view.id : null ),
                    protocol: obj.info.protocol ? obj.info.protocol : ( is_wms ? 'WMS' : null ),
                    url: obj.info.url ? obj.info.url : ( is_wms ? obj.view.urls[0] : null )
                }
            });

        } /* end of parseProductLayer() */

        function parseOverlayLayer(obj) {

            return new LayerModel({
                name: obj.name,
                visible: obj.visible,
                layers: obj.id,
                view: {
                    id : obj.id,
                    urls : obj.urls,
                    protocol: obj.protocol,
                    projection: obj.projection,
                    attribution: obj.attribution,
                    matrixSet: obj.matrixSet,
                    style: obj.style,
                    format: obj.format,
                    resolutions: obj.resolutions,
                    maxExtent: obj.maxExtent,
                    gutter: obj.gutter,
                    buffer: obj.buffer,
                    units: obj.units,
                    transitionEffect: obj.transitionEffect,
                    isphericalMercator: obj.isphericalMercator,
                    isBaseLayer: false,
                    wrapDateLine: obj.wrapDateLine,
                    zoomOffset: obj.zoomOffset,
                    time: obj.time,
                    requestEncoding: obj.requestEncoding
                }
            });

        } /* end of parseOverlayLayer() */

        function parseBaseLayer(obj) {

            return new LayerModel({
                name: obj.name,
                visible: obj.visible,
                layers: obj.id,
                view: {
                    id : obj.id,
                    urls : obj.urls,
                    protocol: obj.protocol,
                    projection: obj.projection,
                    attribution: obj.attribution,
                    matrixSet: obj.matrixSet,
                    style: obj.style,
                    format: obj.format,
                    resolutions: obj.resolutions,
                    maxExtent: obj.maxExtent,
                    gutter: obj.gutter,
                    buffer: obj.buffer,
                    units: obj.units,
                    transitionEffect: obj.transitionEffect,
                    isphericalMercator: obj.isphericalMercator,
                    isBaseLayer: true,
                    wrapDateLine: obj.wrapDateLine,
                    zoomOffset: obj.zoomOffset,
                    time: obj.time,
                    requestEncoding: obj.requestEncoding
                }
            });

        } /* end of parseBaseLayer() */

        return {
            parseProductLayer: parseProductLayer,
            parseOverlayLayer: parseOverlayLayer,
            parseBaseLayer: parseBaseLayer,
            LayerModel: LayerModel
        };

	});

}).call( this );
