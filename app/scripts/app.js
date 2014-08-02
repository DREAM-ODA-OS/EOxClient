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
		'communicator','globals',
		'regions/DialogRegion','regions/UIRegion',
		'layouts/LayerControlLayout',
		'layouts/ToolControlLayout',
		'jquery', 'backbone.marionette',
		'controller/ContentController',
		'controller/DownloadController',
        'controller/LayerInfoController',
		'controller/SelectionManagerController',
        'controller/IngestionAdminT5Controller',
        'controller/AddLocalProductController',
        'controller/IngestionAdminT6Controller',
        'controller/OrthoQualityController',
        'vendor/mwps',
		'router'
	],

	function( Backbone, Communicator, globals, DialogRegion, 
			  UIRegion, LayerControlLayout, ToolControlLayout ) {

		var Application = Backbone.Marionette.Application.extend({
			initialize: function(options) {
                // clear permanent local storage 
                localStorage.clear()
			},

			configure: function(config) {

				// Load jquery ui tooltip tool
                $(document).tooltip({ 
                	position: { my: "left+5 center", at: "right center" },
                	hide: { effect: false, duration: 0 },
                	show:{ effect: false, delay: 700}
                });

                // Ingestion Engine options
				globals.objects.add('ingestionEngineT5', config.ingestionEngineT5);

				// Application regions are loaded and added to the Marionette Application
				_.each(config.regions, function(region) {
					var obj ={};
					obj[region.name] = "#" + region.name;
					this.addRegions(obj);
					console.log("Added region " + obj[region.name]);
				}, this);

				//Load all configured views
				var views = {};
				_.each(config.views, function(item){ $.extend(views,require(item)); }, this);

				//Load all configured models
				var models = {}
				_.each(config.models, function(item){ $.extend(models,require(item)); }, this);

				//Load all configured templates
				var templates = {};	//templates
				_.each(config.templates, function(item){ templates[item.id] = require(item.template); }, this);


				//Map attributes are loaded and added to the global map model
				globals.objects.add('mapmodel', models.parseMapConfig(config.mapConfig)); 

				//Base Layers are loaded and added to the global collection
				_.each(config.mapConfig.baseLayers, function(item) {
					globals.baseLayers.add( models.parseBaseLayer(item) );
					console.log("Added base-layer " + item.id );
				}, this);

				//Overlays are loaded and added to the global collection
				_.each(config.mapConfig.overlays, function(item) {
					globals.overlays.add( models.parseOverlayLayer(item) );
					console.log("Added overlay-layer " + item.id );
				}, this);

				//Productsare loaded and added to the global collection
				_.each(config.mapConfig.products, function(item) {
					globals.products.add( models.parseProductLayer(item) );
					console.log("Added data-layer " + item.view.id );
				}, this);


				// Create map view and execute show of its region
				this.map.show(new views.MapView({el: $("#map")}));

				// If Navigation Bar is set in configuration go through the
				// defined elements creating a item collection to rendered
				// by the marionette collection view
				if (config.navBarConfig) {

					globals.navBarItems = new models.NavBarCollection();

					_.each(config.navBarConfig.items, function(item){
						globals.navBarItems.add(models.parseNavBarItemConfig(item));
					}, this);

					this.topBar.show(new views.NavBarCollectionView(
						{template: templates.NavBar({
							title: config.navBarConfig.title,
							url: config.navBarConfig.url}),
						className:"navbar navbar-inverse navbar-opaque navbar-fixed-top not-selectable",
						itemView: views.NavBarItemView, tag: "div",
						collection: globals.navBarItems}));

				};

				// Added region to test combination of backbone
				// functionality combined with jQuery UI
				this.addRegions({dialogRegion: DialogRegion.extend({el: "#viewContent"})});
				this.DialogContentView = new views.ContentView({
					template: {type: 'handlebars', template: templates.Info},
                    id: "about",
                    className: "modal fade",
                    attributes: {
                        role: "dialog",
                        tabindex: "-1",
                        "aria-labelledby": "about-title",
                        "aria-hidden": true,
                        "data-keyboard": true,
                        "data-backdrop": "static"
                    }
				});

				// Create the views - these are Marionette.CollectionViews that render ItemViews
                this.baseLayerView = new views.BaseLayerSelectionView({
                	collection:globals.baseLayers,
                	itemView: views.LayerItemView.extend({
                		template: {
                			type:'handlebars',
                			template: templates.BulletLayer
                		},
                		className: "radio"
                	})
                });

                this.productsView = new views.LayerSelectionView({
                	collection:globals.products,
                	itemView: views.LayerItemView.extend({
                		template: {
                			type:'handlebars',
                			template: templates.CheckBoxLayer
                		},
                		className: "sortable-layer"
                	}),
                	className: "sortable"
                });

                this.overlaysView = new views.BaseLayerSelectionView({
                	collection:globals.overlays,
                	itemView: views.LayerItemView.extend({
                		template: {
                			type:'handlebars',
                			template: templates.CheckBoxOverlayLayer
                		},
                		className: "checkbox"
                	}),
                	className: "check"
                });

                // Create layout that will hold the child views
                this.layout = new LayerControlLayout();


                // Define collection of selection tools
                var selectionToolsCollection = new models.ToolCollection();
                _.each(config.selectionTools, function(item) {
					selectionToolsCollection.add( models.parseSelectionTool(item) );
				}, this);

                // Define collection of visualization tools
                var visualizationToolsCollection = new models.ToolCollection();
                _.each(config.visualizationTools, function(item) {
					visualizationToolsCollection.add( models.parseVisualizationTool(item) ); 
				}, this);

                // Create Collection Views to hold set of views for selection tools
                this.visualizationToolsView = new views.ToolSelectionView({
                	collection:visualizationToolsCollection,
                	itemView: views.ToolItemView.extend({
                		template: {
                			type:'handlebars',
                			template: templates.ToolIcon
                		}
                	})
                });

                // Create Collection Views to hold set of views for visualization tools
                this.selectionToolsView = new views.ToolSelectionView({
                	collection:selectionToolsCollection,
                	itemView: views.ToolItemView.extend({
                		template: {
                			type:'handlebars',
                			template: templates.ToolIcon
                		}
                	})
                });


                // Create layout to hold collection views
                this.toolLayout = new ToolControlLayout();


                this.timeSliderView = new views.TimeSliderView(config.timeSlider);
                this.bottomBar.show(this.timeSliderView);

				// Add a trigger for ajax calls in order to display loading state
				// in mouse cursor to give feedback to the user the client is busy
				$(document).ajaxStart(function() {
				  Communicator.mediator.trigger("progress:change", true);
				});

				$(document).ajaxStop(function() {
				  Communicator.mediator.trigger("progress:change", false);
				});

				$(document).ajaxError(function( event, request, settings ) {
					var statuscode = "";
					if (request.status != 0)
						statuscode =  '<br>Status Code: '+ request.status;
					$("#error-messages").append(
					  	'<div class="alert alert-warning alert-danger">'+
						  '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
						  '<strong><i class="fa fa-fw fa-exclamation-triangle"></i>&nbsp;ERROR: '+
                          'HTTP/' + settings.type + ' request failed!</strong>'+
                          '<br>URL:&nbsp;'+settings.url.split("?")[0] + statuscode +
						'</div>'
					);
				});

				// Go through Navigation Bar items and throw activation event for all
                // elements that are marked with show == true
                if (config.navBarConfig) {

					_.each(config.navBarConfig.items, function(list_item){
						if(list_item.show){
							Communicator.mediator.trigger(list_item.eventToRaise);
						}
					}, this);
				}

				// Remove loading screen when this point is reached in the script
				$('#loadscreen').remove();

			}

		});

		return new Application();
	});
}).call( this );
