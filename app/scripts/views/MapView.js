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

define(['backbone',
		'communicator',
		'globals',
		'openlayers',
		'models/MapModel',
		'filesaver'
		],
		function( Backbone, Communicator, globals ) {

			var MapView = Backbone.View.extend({
				
				onShow: function() {

                    var mapView = this

					this.tileManager = new OpenLayers.TileManager();
					this.map = new OpenLayers.Map({
						div: "map",
						fallThrough: true,
						tileManager: this.tileManager,
						controls: [
						 	new OpenLayers.Control.Navigation(),
	                        new OpenLayers.Control.Zoom( { zoomInId: "zoomIn", zoomOutId: "zoomOut" } ),
	                        new OpenLayers.Control.Attribution( { displayClass: 'olControlAttribution' } )
	                    ]
					});

					this.timeinterval = { start: null, end: null } ;

					console.log("OpenLayer map created.");

					//listen to moeveend event in order to keep router uptodate
					this.map.events.register("moveend", this.map, function(data) {

                        Communicator.mediator.trigger("router:setUrl", {
                            time: mapView.timeinterval,
                            center: data.object.center,
                            zoomLevel: data.object.zoom
                        });

			            Communicator.mediator.trigger("map:position:change", data.object.getExtent());
			        });

                    this.map.events.register("updatesize", this.map, function(data) {
                        Communicator.mediator.trigger("map:size:change", data.object.getSize());
                    });

					this.listenTo(Communicator.mediator, "map:center", this.centerMap);
					this.listenTo(Communicator.mediator, "map:layer:change", this.changeLayer);
					this.listenTo(Communicator.mediator, "map:layer:changeAttr", this.changeLayerAttributes);
					this.listenTo(Communicator.mediator, 'map:set:extent', this.onSetExtent);
					this.listenTo(Communicator.mediator, "productCollection:sortUpdated", this.onSortProducts);
					this.listenTo(Communicator.mediator, "productCollection:updateOpacity", this.onUpdateOpacity);
					this.listenTo(Communicator.mediator, "selection:activated", this.onSelectionActivated);
					this.listenTo(Communicator.mediator, "map:load:geojson", this.onLoadGeoJSON);
					this.listenTo(Communicator.mediator, "map:export:geojson", this.onExportGeoJSON);
					this.listenTo(Communicator.mediator, 'time:change', this.onTimeChange);
					this.listenTo(Communicator.mediator, 'selection:changed', this.onSelectionChanged);
					this.listenTo(Communicator.mediator, 'selection:bbox:changed', this.onSelectionBBoxChanged);
					this.listenTo(Communicator.mediator, 'map:marker:set', this.setMarker);
					this.listenTo(Communicator.mediator, 'map:marker:clearAll', this.clearMarkers);
					this.listenTo(Communicator.mediator, 'map:layer:save', this.getLayerURL);
					this.listenTo(Communicator.mediator, 'map:preview:set', this.onPreviewLayerCreate);
					this.listenTo(Communicator.mediator, 'map:preview:clear', this.onPreviewLayerRemove);

					Communicator.reqres.setHandler('map:get:extent', _.bind(this.onGetMapExtent, this));
					Communicator.reqres.setHandler('get:selection:json', _.bind(this.onGetGeoJSON, this));

                    // preview layer - set later by the callback
                    this.previewLayer = null;

					// Add layers for different selection methods
					this.vectorLayer = new OpenLayers.Layer.Vector("Vector Layer");
					this.markerLayer = new OpenLayers.Layer.Markers("Marker Layer");

	                this.map.addLayers([this.vectorLayer,this.markerLayer]);
	                this.map.addControl(new OpenLayers.Control.MousePosition());

	                this.drawControls = {
	                    pointSelection: new OpenLayers.Control.DrawFeature(this.vectorLayer,
	                        OpenLayers.Handler.Point),
	                    lineSelection: new OpenLayers.Control.DrawFeature(this.vectorLayer,
	                        OpenLayers.Handler.Path),
	                    polygonSelection: new OpenLayers.Control.DrawFeature(this.vectorLayer,
	                        OpenLayers.Handler.Polygon),
	                    bboxSelection: new OpenLayers.Control.DrawFeature(this.vectorLayer,
	                        OpenLayers.Handler.RegularPolygon, {
	                            handlerOptions: {
	                                sides: 4,
	                                irregular: true
	                            }
	                        }
	                    )
	                };

                    //create shared marker icons
                    globals.icons = {}
                    globals.icons.pinWhite = new OpenLayers.Icon( 'images/icons/marker_pin_white.png', {w:19,h:32}, {x:-9,y:-32})

	                var that = this;

	               OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {                
		                defaultHandlerOptions: {
		                    'single': true,
		                    'double': false,
		                    'pixelTolerance': 0,
		                    'stopSingle': false,
		                    'stopDouble': false
		                },

		                initialize: function(options) {
		                    this.handlerOptions = OpenLayers.Util.extend(
		                        {}, this.defaultHandlerOptions
		                    );
		                    OpenLayers.Control.prototype.initialize.apply(
		                        this, arguments
		                    ); 
		                    this.handler = new OpenLayers.Handler.Click(
		                        that, {
		                            'click': that.onMapClick
		                        }, this.handlerOptions
		                    );
		                }

		            });

                    var click = new OpenLayers.Control.Click();
	                this.map.addControl(click);
	                click.activate();

	                for(var key in this.drawControls) {
	                    this.map.addControl(this.drawControls[key]);
	                    this.drawControls[key].events.register("featureadded",'', this.onDone);
	                }

					//Go through all defined baselayer and add them to the map
					globals.baseLayers.each(function(baselayer) {
						this.map.addLayer(this.createLayer(baselayer));
					}, this);

					// Go through all products and add them to the map
					globals.products.each(function(product){
						this.map.addLayer(this.createLayer(product));
					}, this);

					// Go through all products and add them to the map
					globals.overlays.each(function(overlay){
						this.map.addLayer(this.createLayer(overlay));
					}, this);

					// Order (sort) the product layers based on collection order
					this.onSortProducts();

					// Openlayers format readers for loading geojson selections
					var io_options = {
		                'internalProjection': this.map.baseLayer.projection,
		                'externalProjection': new OpenLayers.Projection('EPSG:4326')
		            }; 

					this.geojson = new OpenLayers.Format.GeoJSON(io_options);


					//Set attributes of map based on mapmodel attributes
				    var mapmodel = globals.objects.get('mapmodel');
				    this.map.setCenter(new OpenLayers.LonLat(mapmodel.get("center")), mapmodel.get("zoom") );

                    // signal the initial map size
                    Communicator.mediator.trigger("map:size:change", this.map.getSize());

				    return this;
				},
				//method to create layer depending on protocol
				//setting possible description attributes
				createLayer: function (layerdesc) {
					var return_layer = null;
					var layer = layerdesc.get('view');

					switch(layer.protocol){
						case "WMTS":
							return_layer = new OpenLayers.Layer.WMTS({
								name: layerdesc.get("name"),
						        layer: layer.id,
						        protocol: layer.protocol,
						        url: layer.urls,
						        matrixSet: layer.matrixSet,
						        style: layer.style,
						        format: layer.format,
						        maxExtent: layer.maxExtent,
						        resolutions: layer.resolutions,
						        projection: layer.projection,
						        gutter: layer.gutter,
						        buffer: layer.buffer,
						        units: layer.units,
						        transitionEffect: layer.transitionEffect,
						        isphericalMercator: layer.isphericalMercator,
						        isBaseLayer: layer.isBaseLayer,
						        wrapDateLine: layer.wrapDateLine,
						        zoomOffset: layer.zoomOffset,
						        visible: layerdesc.get("visible"),
						        time: layerdesc.time,
						        attribution: layer.attribution,
						        requestEncoding: layer.requestEncoding
							});
							break;

						case "WMS":
						return_layer = new OpenLayers.Layer.WMS(
								layerdesc.get("name"),
						        layer.urls[0],
						        {
						        	layers: layerdesc.get('layers'), // NOTE: the WMS layers can be changed by the client.
						        	transparent: "true",
        							format: "image/png",
        							time: layer.time
						    	},
						        {
						        	format: 'image/png',
							        matrixSet: layer.matrixSet,
							        style: layer.style,
							        format: layer.format,
							        maxExtent: layer.maxExtent,
							        resolutions: layer.resolutions,
							        projection: layer.projection,
							        gutter: layer.gutter,
							        buffer: layer.buffer,
							        units: layer.units,
							        transitionEffect: layer.transitionEffect,
							        isphericalMercator: layer.isphericalMercator,
							        isBaseLayer: layer.isBaseLayer,
							        wrapDateLine: layer.wrapDateLine,
							        zoomOffset: layer.zoomOffset,
							        visibility: layerdesc.get("visible"),
							        attribution: layer.attribution
							    }
							);
							break;

					};
					// for progress indicator
				    return_layer.events.register("loadstart", this, function() {
				      Communicator.mediator.trigger("progress:change", true);
				    });
				    return_layer.events.register("loadend", this, function() {
				      Communicator.mediator.trigger("progress:change", false);
				    });
					return return_layer;		
				},

				centerMap: function(data){
					this.map.setCenter(new OpenLayers.LonLat(data.lon, data.lat), data.zoomLevel );
				},

				changeLayer: function(options){
					if (options.isBaseLayer){
						globals.baseLayers.forEach(function(model, index) {
						    model.set("visible", false);
						});
						globals.baseLayers.find(function(model) { return model.get('name') == options.name; }).set("visible", true);
						this.map.setBaseLayer(this.map.getLayersByName(options.name)[0]);
					}else{
						var product = globals.products.find(function(model) { return model.get('name') == options.name; });
						if (product){
							product.set("visible", options.visible);
						}else{
							globals.overlays.find(function(model) { return model.get('name') == options.name; }).set("visible", options.visible);
						}
						this.map.getLayersByName(options.name)[0].setVisibility(options.visible);
						
					}
				},

                changeLayerAttributes: function(options) {
                    var product = globals.products.find(function(model){return model.get('name') == options.name;});
                    if (!product) return ;
                    var view = product.get('view');

                    var new_params = {};

                    if (view && (view.protocol="WMS")) {
                        new_params['layers'] = product.get('layers');
                        new_params['dim_bands'] = product.get('bands') ? product.get('bands') : null;
                    }

                    this.map.getLayersByName(options.name)[0].mergeNewParams(new_params);
                },

				onSortProducts: function(productLayers) {
				    globals.products.each(function(product) {
				      var productLayer = this.map.getLayersByName(product.get("name"))[0];
				      var index = globals.products.indexOf(productLayer);
				      this.map.setLayerIndex(productLayer, index);
				    }, this);
				    console.log("Map products sorted");
				},

				onUpdateOpacity: function(options) {
					var layer = this.map.getLayersByName(options.model.get("name"))[0];
					if (layer){
						layer.setOpacity(options.value);
					}
				},

				onSelectionActivated: function(arg){
					if(arg.active){
						for(key in this.drawControls) {
		                    var control = this.drawControls[key];
		                    if(arg.id == key) {
		                        control.activate();
		                    } else {
		                    	control.layer.removeAllFeatures();
		                        control.deactivate();
		                        Communicator.mediator.trigger("selection:changed", null);
		                    }
		                }
		            }else{
		            	for(key in this.drawControls) {
		                    var control = this.drawControls[key];
		                    control.layer.removeAllFeatures();
		                    control.deactivate();
		                    Communicator.mediator.trigger("selection:changed", null);
	                    
	                	}	
		            }
				},

				onLoadGeoJSON: function (data) {
					this.vectorLayer.removeAllFeatures();
					var features = this.geojson.read(data);
					var bounds;
		            if(features) {
		                if(features.constructor != Array) {
		                    features = [features];
		                }
		                for(var i=0; i<features.length; ++i) {
		                    if (!bounds) {
		                        bounds = features[i].geometry.getBounds();
		                    } else {
		                        bounds.extend(features[i].geometry.getBounds());
		                    }

		                }
		                this.vectorLayer.addFeatures(features);
		                this.map.zoomToExtent(bounds);
					}
				},

                setMarker: function(lonlat) {
                    this.markerLayer.clearMarkers();
                    var marker = new OpenLayers.Marker(lonlat,globals.icons.pinWhite.clone());
                    //var marker = new OpenLayers.Marker(lonlat);
                    this.markerLayer.addMarker(marker)
                },

                clearMarkers: function() {
                    this.markerLayer.clearMarkers();
                },

                getLayerURL: function(obj) {
                    //TODO: move to global map configuration
                    var map_crs_reverse_axes = true;

                    function getMapWMS13(layer, prm)
                    {
                        return {
                            prm: prm,
                            url: layer.get('view').urls[0] +
                                '?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap' +
                                '&LAYERS=' + layer.get('layers') +
                                '&BBOX=' + prm.bbox.toBBOX(10,map_crs_reverse_axes) + '&CRS=' + prm.crs +
                                '&TIME=' + getISODateTimeString(prm.time.start) + '/' + getISODateTimeString(prm.time.end) +
                                '&HEIGHT=' + prm.size.h + '&WIDTH=' + prm.size.w + "&TRANSPARENT=true" + "&STYLES=" +
                                '&FORMAT=' + prm.format + (layer.get('bands') ? '&DIM_BANDS='+layer.get('bands') : "")
                            /*
                            url: layer.get('view').urls[0],
                            query: {
                                SERVICE: 'WMS',
                                VERSION: '1.3.0',
                                REQUEST: 'GetMap',
                                LAYERS: layer.get('layers'),
                                BBOX: prm.bbox.toBBOX(10,map_crs_reverse_axes),
                                CRS: prm.crs,
                                TIME: getISODateTimeString(prm.time.start)+'/'+ getISODateTimeString(prm.time.end),
                                HEIGHT: String(prm.size.h),
                                WIDTH: String(prm.size.w),
                                TRANSPARENT: 'true',
                                STYLES: '',
                                FORMAT: prm.format,
                                DIM_BANDS: layer.get('bands') ? layer.get('bands') : null,
                            }
                            */
                        }
                    }

                    // request Parameters
                    var prm = {
                        time: {
                            start: this.timeinterval.start,
                            end: this.timeinterval.end
                        },
                        bbox: this.map.getExtent(),
                        crs: this.map.projection,
                        size: this.map.getSize(),
                        format: obj.format
                    };

                    // run the passed callback
                    obj.action(getMapWMS13(obj.layer, prm))
                },

                onMapClick: function(clickEvent){

                    //TODO: move to global map configuration
                    var map_crs_reverse_axes = true;

                    // prepare getFeatureInfo request
                    function getFeatureInfoWMS13(info,prm){

                        var format = "text/html" ;
                        var maxFeatureCount = 1 ;

                        var request = info.url +
                            '?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo' +
                            '&LAYERS=' + info.id + '&QUERY_LAYERS=' + info.id +
                            '&BBOX=' + prm.bbox.toBBOX(10,map_crs_reverse_axes) + '&CRS=' + prm.crs +
                            '&TIME=' + getISODateTimeString(prm.time.start) + '/' + getISODateTimeString(prm.time.end) +
                            '&HEIGHT=' + prm.size.h + '&WIDTH=' + prm.size.w +
                            '&X=' + prm.xy.x + '&Y=' + prm.xy.y +
                            '&INFO_FORMAT=' + format + '&FEATURE_COUNT=' + maxFeatureCount ;

                        return {
                            type: 'GET',
                            url: request
                        }
                    }

                    // prepare getFeatureInfo request
                    function getCoverageInfoWPS10(info, prm){

                        var request = info.url +
                            "?SERVICE=WPS&VERSION=1.0.0&REQUEST=Execute&IDENTIFIER=getCoverageInfo" +
                            "&RawDataOutput=info&DATAINPUTS=identifier%3D" + info.id +
                            "%3Bbegin_time%3D" + getISODateTimeString(prm.time.start) +
                            "%3Bend_time%3D" + getISODateTimeString(prm.time.end) +
                            "%3Blongitude%3D" + prm.lonlat.lon + "%3Blatitude%3D" + prm.lonlat.lat

                        return {
                            type: 'GET',
                            url: request
                        }
                    }

                    // get active data-layers
                    var layers = globals.products.filter(function(model) { return model.get('visible'); });

                    // request Parameters
                    var prm = {
                        time: {
                            start: this.timeinterval.start,
                            end: this.timeinterval.end
                        },
                        lonlat: this.map.getLonLatFromPixel(clickEvent.xy),
                        bbox: this.map.getExtent(),
                        crs: this.map.projection,
                        xy: clickEvent.xy,
                        size: {
                            w: clickEvent.currentTarget.clientWidth,
                            h: clickEvent.currentTarget.clientHeight
                        }
                    };

                    // click lon/lat coordinates
                    var lonlat = this.map.getLonLatFromPixel(clickEvent.xy);

                    // display a marker (if at least one layer selected)
                    if ( layers.length > 0 ) {
                        // display marker only
                        Communicator.mediator.trigger("map:marker:set",prm.lonlat);
                    } else {
                        // clear any displayed marker
                        Communicator.mediator.trigger("map:marker:clearAll");
                    }

                    // trigger an event reseting the view 
                    Communicator.mediator.trigger("info:start",{ lonlat: prm.lonlat, products: layers})

                    for (var i=0 ; i<layers.length ; ++i ) {

                        var layer = layers[i]
                        var info = layers[i].get('info') ;
                        var request = null;

                        switch ( info.protocol ) {
                            case 'WMS': // WMS protocol - getFeatureInfo
                                request = getFeatureInfoWMS13(info,prm);
                                break;

                            case 'WPS': // WPS protocol - EOxServer specific
                                request = getCoverageInfoWPS10(info, prm);
                                break;

                            default:
                                console.error('Unsupported info protocol "'+info.protocol+'" ! LAYER="'+layer.get('view').id+'"');
                                continue;
                        }

                        // get the response

                        $.ajax( _.extend(_.clone(request),{
                            async: false,
                            global: false,
                            success: function(data,status_,xhr,dtype) {
                                Communicator.mediator.trigger("info:response", {
                                    lonlat: prm.lonlat, // click coordinates
                                    protocol: info.protocol, // request protocol
                                    request: request,   // request object
                                    product: layer,     // data-layer (product) definition
                                    data: data,         // response data
                                    ctype: xhr.getResponseHeader('Content-Type') // HTTP response content-type
                                });
                            },
                            error: function(xhr, status_, error) {
                                var url = request.url ;
                                var url_short = ( url.length > 40 ? url.substring(0, 37)+'...' : url ) ;
                                console.log(xhr);
                                $("#error-messages").append(
                                    '<div class="alert alert-warning alert-danger">'+
                                      '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
                                      '<strong>Warning!</strong> '
                                      +'Info request failed!<br>'
                                      +'ERROR: '+xhr.status+' '+xhr.statusText+'<br>'
                                      +'URL: <a target="_blank" href="'+url+'">'+url_short+'</a><br>'+
                                    '</div>'
                                );
                            }
                        }));

                    }

                    // trigger an event iindicating end of the responses
                    Communicator.mediator.trigger("info:stop")

                },

				onExportGeoJSON: function() {		
					var geojsonstring = this.geojson.write(this.vectorLayer.features, true);
					
					var blob = new Blob([geojsonstring], {type: "text/plain;charset=utf-8"});
					saveAs(blob, "selection.geojson");
				},
				
				onDone: function (evt) {
					// TODO: How to handle multiple draws etc has to be thought of
					// as well as what exactly is comunicated out
					Communicator.mediator.trigger("selection:changed", evt.feature.geometry);
				},

				onSelectionBBoxChanged: function (values) {
					this.vectorLayer.removeAllFeatures();

					var points = [
					    new OpenLayers.Geometry.Point(values.left, values.bottom),
					    new OpenLayers.Geometry.Point(values.left, values.top),
					    new OpenLayers.Geometry.Point(values.right, values.top),
					    new OpenLayers.Geometry.Point(values.right, values.bottom)
					];
					var ring = new OpenLayers.Geometry.LinearRing(points);
					var polygon = new OpenLayers.Geometry.Polygon([ring]);

					var feature = new OpenLayers.Feature.Vector(polygon);
					this.vectorLayer.addFeatures([feature]);
					
				},

				onSelectionChanged: function (geometry) {
					for(key in this.drawControls) {
		               this.drawControls[key].deactivate();	                    
	                }	
				},

                onTimeChange: function (time) {
                    this.timeinterval = time;

                    //update routes
                    Communicator.mediator.trigger("router:setUrl", {
                        time: this.timeinterval,
                        center: this.map.center,
                        zoomLevel: this.map.zoom
                    });

                    var string = getISODateTimeString(time.start) + "/"+ getISODateTimeString(time.end);

                    globals.products.each(function(product) {
                        if(product.get("timeSlider")){
                            var productLayer = this.map.getLayersByName(product.get("name"))[0];
                            productLayer.mergeNewParams({'time':string});
                        }
                    }, this);

                    Communicator.mediator.trigger("map:time:change", {star: time.start, end: time.end});
                },

				onGetMapExtent: function(){
	            	return this.map.getExtent();
	            },

	            onSetExtent: function(bbox) {
	            	this.map.zoomToExtent(bbox);
	            },

				onGetGeoJSON: function () {
					return this.geojson.write(this.vectorLayer.features, true);
				},

                onPreviewLayerCreate: function(url, layers, params){

                    // remove the previous layer if exists
                    this.onPreviewLayerRemove()

                    // create new layer with the defualt options
                    this.previewLayer = new OpenLayers.Layer.WMS(
                        "__preview_WMS_layer_",
                        url,
                        {
                            layers: layers,
                            transparent: "true",
                            format: "image/png"
                        },
                        {
                            isBaseLayer: false
                        }
                    );

                    // merge any possible additional user parameters
                    if(typeof params !== 'undefined'){
                        this.previewLayer.mergeNewParams(params);
                    }

                    // add the layer to the map
                    this.map.addLayer(this.previewLayer);
                },

                onPreviewLayerRemove: function(){
                    if (this.previewLayer){
                        // unlink and reset the existing layer
                        this.map.removeLayer(this.previewLayer);
                        this.previewLayer = null;
                    }
                }

			});

			return {"MapView":MapView};
	});


