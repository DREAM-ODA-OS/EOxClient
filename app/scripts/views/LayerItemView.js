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
		'communicator',
		'views/AuthView',
		'models/AuthModel',
		'globals',
		'app',
		'hbs!tmpl/BulletLayer',
		'hbs!tmpl/iFrame',
		'underscore'
	],
	function( Backbone, Communicator, av, am, globals, App, BulletLayerTmpl, iFrameTmpl) {
		var LayerItemView = Backbone.Marionette.ItemView.extend({
			tagName: "li",
			events: {
				'drop' : 'drop',
				'change': 'onChange',
				'click .fa-adjust': 'onOpenSlider',
				'slide .ui-slider': 'onOpacityAdjust'
			},

			initialize: function(options) {

				this.$slider = $('<div>').slider({
			        range: "max",
			        max: 100,
			        min: 0
			    });
			    this.$slider.width(100);
			},
			onShow: function(view){

				$( ".sortable" ).sortable({
					revert: true,
					delay: 90,
					containment: ".layercontrol .panel-body",
					axis: "y",
					forceHelperSize: true,
					forcePlaceHolderSize: true,
					placeholder: "sortable-placeholder",
					handle: '.fa-sort',
					start: function(event, ui) {
						$( ".ui-slider" ).detach();
						$('.fa-adjust').toggleClass('active')
						$('.fa-adjust').popover('hide');
					},
					stop: function(event, ui) {
						ui.item.trigger('drop', ui.item.index());
		        	}
			    });

			    $('.fa-adjust').popover({
        			trigger: 'manual'
    			});
			},


			onChange: function(evt){
                var isBaseLayer = false;
                if (this.model.get('view').isBaseLayer)
                	isBaseLayer = true;
                var options = { name: this.model.get('name'), isBaseLayer: isBaseLayer, visible: evt.target.checked };
                if( !isBaseLayer && evt.target.checked ){
                	var layer = globals.products.find(function(model) { return model.get('name') == options.name; });
                    if (layer != -1  && !(typeof layer === 'undefined')) {
                    	var url = layer.get('view').urls[0]+"?";

                    	if (url.indexOf('https') > -1){

                    		var layer = layer.get('view').id;
							var req = "LAYERS=" + layer + "&TRANSPARENT=true&FORMAT=image%2Fpng&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&SRS=EPSG%3A4326";
							req += "&BBOX=33.75,56.25,33.80,56.50&WIDTH=2&HEIGHT=2";
							req = url + req;

	                    	$.ajax({
							    url: req,
							    type: "GET",
							    suppressErrors: true,
							    xhrFields: {
							      withCredentials: true
							   	},
							    success: function(xml, textStatus, xhr) {
							        Communicator.mediator.trigger('map:layer:change', options);
							    },
							    error: function(jqXHR, textStatus, errorThrown) {
							    	if (jqXHR.status == 403){
							    		$("#error-messages").append(
					                              '<div class="alert alert-warning alert-danger">'+
					                              '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+
					                              '<strong>Warning!</strong> You are not authorized to access this product' +
					                            '</div>'
					                    );
							    	}else{
							    		
							    		this.authview = new av.AuthView({
								    		model: new am.AuthModel({url:req}),
								    		template: iFrameTmpl,
								    		layerprop: options
								    	});

								    	Communicator.mediator.trigger("progress:change", false);

								    	App.info.show(this.authview);

							    	}
							    }
							});
	                    }else{
	                    	Communicator.mediator.trigger('map:layer:change', options);
	                    }
                    }else if (typeof layer === 'undefined'){
 	                	Communicator.mediator.trigger('map:layer:change', options);
 	                }
                } else if (!evt.target.checked){
                	Communicator.mediator.trigger('map:layer:change', options);
        	 	} else if (isBaseLayer && evt.target.checked){
	             	Communicator.mediator.trigger('map:layer:change', options);
                }
            },

            drop: function(event, index) {
		        Communicator.mediator.trigger('productCollection:updateSort', {model:this.model, position:index});
		    },

		    onOpenSlider: function(evt){

		    	if (this.$('.fa-adjust').toggleClass('active').hasClass('active')) {
		            this.$('.fa-adjust').popover('show');
		            this.$('.popover-content')
		                .empty()
		                .append(this.$slider);
		            this.$( ".ui-slider" ).slider( "option", "value", this.model.get("opacity") * 100 );


		        } else {
		            this.$slider.detach();
		            this.$('.fa-adjust').popover('hide');
		        }
		    },

		    onOpacityAdjust: function(evt, ui) {
		    	this.model.set("opacity", ui.value/100);
		    	Communicator.mediator.trigger('productCollection:updateOpacity', {model:this.model, value:ui.value/100});
		    }

		});
		return {'LayerItemView':LayerItemView};
	});
}).call( this );
