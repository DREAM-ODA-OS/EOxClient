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
        'backbone',
        'communicator',
        'app'
    ],

    function( Backbone, Communicator, App ) {

        var ContentController = Backbone.Marionette.Controller.extend({

            initialize: function(options){
                this.listenTo(Communicator.mediator, "dialog:open:about", this.onDialogOpenAbout);
                this.listenTo(Communicator.mediator, "ui:open:layercontrol", this.onLayerControlOpen);
                this.listenTo(Communicator.mediator, "ui:close:layercontrol", this.onLayerControlClose);
                this.listenTo(Communicator.mediator, "ui:toggle:layercontrol", this.onLayerControlToggle);
                this.listenTo(Communicator.mediator, "ui:open:toolselection", this.onToolSelectionOpen);
                this.listenTo(Communicator.mediator, "ui:close:toolselection", this.onToolSelectionClose);
                this.listenTo(Communicator.mediator, "ui:toggle:toolselection", this.onToolSelectionToggle);
            },

            isLayerControlClosed: function(){
                return _.isUndefined(App.layout.isClosed) || App.layout.isClosed ;
            },

            isToolSelectionClosed: function(){
                return _.isUndefined(App.toolLayout.isClosed) || App.toolLayout.isClosed ;
            },

            onDialogOpenAbout: function(event_){
                App.dialogRegion.show(App.DialogContentView);
            },

            onLayerControlOpen: function(event_){
                //We have to render the layout before we can
                //call show() on the layout's regions
                if ( this.isLayerControlClosed() ) {
                    App.leftSideBar.show(App.layout);
                    App.layout.baseLayers.show(App.baseLayerView);
                    App.layout.products.show(App.productsView);
                    App.layout.overlays.show(App.overlaysView);
                }
            },

            onLayerControlClose: function(event_){
                if ( ! this.isLayerControlClosed() ) {
                    App.layout.close();
                }

            },

            onLayerControlToggle: function(event_){
                if ( this.isLayerControlClosed() ) {
                    this.onLayerControlOpen(event_);
                } else {
                    this.onLayerControlClose(event_);
                }

            },

            onToolSelectionOpen: function(event_){
                //We have to render the layout before we can
                //call show() on the layout's regions
                if ( this.isToolSelectionClosed() )
                {
                    App.rightSideBar.show(App.toolLayout);
                    App.toolLayout.selection.show(App.selectionToolsView);
                    App.toolLayout.visualization.show(App.visualizationToolsView);
                }
            },

            onToolSelectionClose: function(event_){
                if ( ! this.isToolSelectionClosed() ) {
                    App.toolLayout.close();
                }
            },

            onToolSelectionToggle: function(event_){
                if ( this.isToolSelectionClosed() ) {
                    this.onToolSelectionOpen(event_);
                } else {
                    this.onToolSelectionClose(event_);
                }
            }

        });

        return new ContentController();

    });

}).call( this );
