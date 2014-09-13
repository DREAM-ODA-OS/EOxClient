//-------------------------------------------------------------------------------
//
// Project: EOxClient <https://github.com/EOX-A/EOxClient>
// Authors: Martin Paces <martin.paces@eox.at>
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

    var root = this ;

    var deps = [
        'backbone',
        'communicator',
        'globals',
        'hbs!tmpl/LayerOptions',
        'underscore'
    ];

    function factory(Backbone, Communicator, globals, LayerOptionsTmpl) {

        var LayerOptionsView = Backbone.Marionette.CompositeView.extend({

            tagName: 'div',
            className: "panel panel-default layer-options not-selectable",
            template: {type: 'handlebars', template: LayerOptionsTmpl},

			events: {
                //'click #btn-get-mosaic': 'onMosaicRequest'
				//'drop' : 'drop',
				//'change': 'onChange',
				//'click .fa-adjust': 'onOpenSlider',
                //'click .form-control': 'onClick'
				//'slide .ui-slider': 'onOpacityAdjust'
			},

            initialize: function() {

                var that = this

				this.$slider = $('<div>').slider({
			        range: "max",
			        max: 100,
			        min: 0,
                    slide: function(evt, ui) {
                        that.$('#layer-options-opacity-value').html(ui.value+"%");
                        var layer = that.model.get('layer');
		    	        layer.set("opacity", ui.value/100);
		    	        Communicator.mediator.trigger('productCollection:updateOpacity', {model:layer, value:ui.value/100});
                    }
			    });
			    //this.$slider.width(100);

                this.model.on('change:layer',this.update,this);

			    this.listenTo(Communicator.mediator, "map:position:change", this.updateDownloadLink);
			    this.listenTo(Communicator.mediator, "map:size:change", this.updateDownloadLink);
            },

            onShow: function (view) {
                this.$('.close').on("click", _.bind(this.close, this));

                this.$el.draggable({
                    containment: "#content" ,
                    scroll: false,
                    handle: '.panel-heading'
                });

                this.$('#layer-options-opacity').append(this.$slider);
                this.update();
            },

            onClose: function() {
		        this.$slider.detach();
            },

            update: function() {
                var layer = this.model.get('layer');

                if (!layer)
                {
                    this.$('#layer-options-label').html('n/a');
                    this.$('#layer-options-alert').html("ERROR: Layer is not set!");
                    return;
                }

                this.$('#layer-options-label').html('<i class="fa fa-square" style="color:'+layer.get('color')+'"></i>&nbsp;'+layer.get('name'));
                this.$('#layer-options-opacity-value').html((layer.get('opacity')*100)+'%')
                this.$('#layer-options-opacity > .ui-slider').slider('option', 'value', layer.get('opacity')*100)

                this.updateDownloadLink()
            },

            updateDownloadLink: function()
            {
                var layer = this.model.get('layer');
			    console.log("updateDownloadLink()");

                if (!layer) return ;

			    console.log("updateDownloadLink() OK");
                var $a = this.$('#btn-get-mosaic')
                var fname = 'mosaic_'+getPackedDateTimeString(new Date())+'.tif';

                Communicator.mediator.trigger("map:layer:save", {
                    layer: layer,
                    format: "image/tiff",
                    action: function(request){
                        $a.attr('download', fname)
                        $a.attr('href', request.url)
                    }
                })
            }

        });

        return {LayerOptionsView: LayerOptionsView};
    }

    root.define(deps, factory);

}).call(this);
