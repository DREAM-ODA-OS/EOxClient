//-------------------------------------------------------------------------------
//
// Project: DREAM
// Authors: Original source by Daniel Santillan <daniel.santillan@eox.at>
//     contribution/mods for temporary quality demo: M. Novacek, siemens-cvc
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

    var deps = [
            'backbone',
            'communicator',
            'globals',
            'app',
            'models/OrthoQualityModel',
            'views/OrthoQualitySelectionView',
            'views/OrthoQualityView'
    ];


    function factory( Backbone, Communicator, globals, App, m, qs, v ) {

        var OrthoQualityController = Backbone.Marionette.Controller.extend( {
                model: new m.OrthoQualityModel(), // instantiate the model 
                view: null, 

                initialize: function(options)
                {
                    // model initialization: 

                    this.model.set('products', {});

                    // register events the component is listenning to: 
                    this.listenTo(Communicator.mediator, "map:layer:change", this.onChangeLayer);
                    this.listenTo(Communicator.mediator, 'time:change', this.onTimeChange);
                    this.listenTo(Communicator.mediator, "selection:changed", this.onSelectionChange);
                    this.listenTo(Communicator.mediator, "selection:bbox:changed", this.onBBoxChange);
                    this.listenTo(Communicator.mediator, "dialog:open:orthoQuality", this.onOrthoQualityOpen);
                    this.listenTo(Communicator.mediator, "dialog:open:orthoQualitySelection", this.onOrthoQualitySelectionOpen);
                    this.listenTo(Communicator.mediator, "dialog:close:orthoQualitySelection", this.onOrthoQualitySelectionClose);
                    this.listenTo(Communicator.mediator, "dialog:toggle:orthoQualitySelection", this.onOrthoQualitySelectionToggle);

                    // instantiate component's view
                    this.view = new qs.OrthoQualitySelectionView({model:this.model});
                },

                // event handlers ...

                onChangeLayer: function (options) {
                    if (!options.isBaseLayer){
                        var layer = globals.products.find(function(model) { return model.get('name') == options.name; });
                        if (layer) { // Layer will be empty if it is an overlay layer
                            var products = this.model.get('products');
                            if(options.visible){
                                products[layer.get('download').id] = layer;
                            }else{
                                delete products[layer.get('download').id];
                            }
                            this.model.set('products', products);
                        }
                    }
                },

                onTimeChange: function(time) {
                    this.model.set('ToI',time);
                },

                onSelectionChange: function(selection) {
                    if (selection != null) {
                        if(selection.CLASS_NAME == "OpenLayers.Geometry.Polygon"){
                            this.model.set('AoI', {
                                    left: selection.bounds.left,
                                    right: selection.bounds.right,
                                    bottom: selection.bounds.bottom,
                                    top: selection.bounds.top,
                                });
                        }
                    }else{
                        this.model.set('AoI', null);
                    }
                },

                onBBoxChange: function(bbox) {
                    this.model.set('AoI', {
                            left: bbox.left,
                            right: bbox.right,
                            bottom: bbox.bottom,
                            top: bbox.top,
                        });
                },


                // control visibility of the OrthoQuality overlay

                isOrthoQualitySelectionClosed: function() {
                    return _.isUndefined(this.view.isClosed) || this.view.isClosed ;
                },

                onOrthoQualityOpen: function (toOpen)
                {
                    if(toOpen){
                        App.viewContent.show(new v.OrthoQualityView({model:this.model}));
                    }
                },

                onOrthoQualitySelectionOpen: function (event)
                {
                    if ( this.isOrthoQualitySelectionClosed() ) {  
                        App.viewContent.show(this.view);
                    } 
                },

                onOrthoQualitySelectionClose: function (event)
                {
                    if ( ! this.isOrthoQualitySelectionClosed() ) {  
                        this.view.close();
                    }
                },

                onOrthoQualitySelectionToggle: function (event_) {
                    if ( this.isOrthoQualitySelectionClosed() ) {
                        this.onOrthoQualitySelectionOpen(event_);
                    } else {
                        this.onOrthoQualitySelectionClose(event_);
                    }
                }

            }); /* end of OrthoQualityController = Backbone.Marionette.Controller.extend() */

        return new OrthoQualityController();

    } /* end of factory() */

    root.require(deps, factory);
    
}).call( this );
