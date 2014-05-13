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
        'app',
        'models/LayerInfoModel',
        'views/LayerInfoView',
        'underscore'
    ];

    function factory( Backbone, Communicator, globals, App, model, view ) {

        var LayerInfoController = Backbone.Marionette.Controller.extend({
        model: new model.LayerInfoModel(),
        view: null,
            initialize: function() {

                this.view = new view.LayerInfoView({model:this.model})

                this.listenTo(Communicator.mediator, "dialog:toggle:layerInfo", this.toggleView);
                this.listenTo(Communicator.mediator, "dialog:open:layerInfo", this.openView);
                this.listenTo(Communicator.mediator, "dialog:close:layerInfo", this.closeView);
                this.listenTo(Communicator.mediator, 'info:start', this.onInfoStart);
                this.listenTo(Communicator.mediator, 'info:response', this.onInfoResponse);
                this.listenTo(Communicator.mediator, 'info:stop', this.onInfoStop);
            },

            // view control
            isClosed: function() {
                return (_.isUndefined(this.view.isClosed) || this.view.isClosed);
            },

            openView: function() {
                if (this.isClosed()) {App.viewContent.show(this.view);}
            },

            closeView: function() {
                if (!this.isClosed()) {this.view.close();}
            },

            toggleView: function() {
                if (this.isClosed()) {this.openView();} else {this.closeView();}
            },

            // model updates
            onInfoStart: function(data) {
                if (data.products.length > 0) {this.openView();}
                this.model.reset(data);
            },

            onInfoStop: function() {
                this.model.finish();
            },

            onInfoResponse: function(data) {
                this.model.receive(data);
            }
        });

        return new LayerInfoController();
    }

    root.require(deps,factory);

}).call( this );
