//-------------------------------------------------------------------------------
//
// Project: EOxClient <https://github.com/EOX-A/EOxClient>
// Authors: Daniel Santillan <daniel.santillan@eox.at>
//          Martin Paces <martin.paces@eox.at>
//          Milan Novacek (CVC)
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
        'models/IngestionAdminT5Model',
        'views/IngestionAdminT5View'
    ];

    function factory( Backbone, Communicator, globals, App, m, ds ) {

        var IngestionAdminT5Controller = Backbone.Marionette.Controller.extend( {

            model: new m.IngestionAdminT5Model(), // instantiate the model
            view: null,

            initialize: function(options) {

                // register events the component is listenning to:
                this.listenTo(Communicator.mediator, "dialog:open:ingestionAdminT5", this.onIngestionAdminOpen);
                this.listenTo(Communicator.mediator, "dialog:close:ingestionAdminT5", this.onIngestionAdminClose);
                this.listenTo(Communicator.mediator, "dialog:toggle:ingestionAdminT5", this.onIngestionAdminToggle);

                // instantiate component's view
                this.view = new ds.IngestionAdminT5View({model:this.model});
            },

            // event handlers ...

            onScenarioListDone: function (data, textStatus, req) {
                console.log("onScenarioListSuccess");
            },

            onScenarioListError: function (data, textStatus, errorThrown) {
                console.log("onScenarioListError: " + textStatus);
                console.log(data.getAllResponseHeaders());
            },

            onScenarioListComplete: function ( data, textStatus, errorThrown) {
                console.log("onScenarioListComplete:");
                console.log(data);
                if (textStatus) {
                    console.log("Ajax request error: " + textStatus);
                    console.log("status: " + data.status);
                }
            },

            // control visibility of the IngestionAdmin overlay

            isIngestionAdminClosed: function() {
                return _.isUndefined(this.view.isClosed) || this.view.isClosed ;
            },

            onIngestionAdminOpen: function(event_) {
                if ( this.isIngestionAdminClosed() ) {
                    App.viewContent.show(this.view);
                }
            },

            onIngestionAdminClose: function(event_) {
                if ( ! this.isIngestionAdminClosed() ) {
                    this.view.close();
                }
            },

            onIngestionAdminToggle: function (event_) {
                if ( this.isIngestionAdminClosed() ) {
                    this.onIngestionAdminOpen();
                } else {
                    this.onIngestionAdminClose();
                }
            }

        }); /* end of IngestionAdminT5Controller = Backbone.Marionette.Controller.extend() */

        return new IngestionAdminT5Controller();

    } /* end of factory() */

    root.require(deps, factory);

}).call(this);
