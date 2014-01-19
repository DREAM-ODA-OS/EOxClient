(function() 
{
    'use strict';

    var root = this;

    root.require(

        [
            'backbone',
            'communicator',
            'globals',
            'app',
            'models/IngestionAdminT5Model',
            'views/IngestionAdminT5View'
        ],

        function( Backbone, Communicator, globals, App, m, ds ) 
        {

            var IngestionAdminT5Controller = Backbone.Marionette.Controller.extend(
            {
                model: new m.IngestionAdminT5Model(), // instantiate the model 
                view: null,                           // 

                initialize: function(options)
                {
                    // model initialization:
                    this.model.fetch( {
                            error:function(m,r,o){
                                console.log("fetch error:\n"+r);
                                for  (var i in r) {
                                    console.log(i+" : "+r[i]);
                                }
                            }
                        });

                    // register events the component is listenning to: 

                    //this.listenTo(Communicator.mediator, 'time:change', this.onTimeChange);
                    //this.listenTo(Communicator.mediator, "selection:changed", this.onSelectionChange);
                    this.listenTo(Communicator.mediator, "dialog:open:ingestionAdminT5", this.onIngestionAdminOpen);
            
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
                    var scenarios;
                    if (textStatus) {
                        console.log("Ajax request error: " + textStatus);
                        console.log("status: " + data.status);
                    }
                    /*
                    if (0==data.ie_status)
                    {
                        scenarios = data.scenarios;
                        console.log(scenarios);
                    }
                    */
                },
               
    /*
                onTimeChange: function(time) {
                    this.model.set('ToI',time);
                },
    */
    /*
                onSelectionChange: function(selection) {
                    if (selection != null) {
                      if(selection.CLASS_NAME == "OpenLayers.Geometry.Polygon"){
                        this.model.set('AoI', selection);
                      }
                    }else{
                      this.model.set('AoI', null);
                    }
                },
    */

                // toggle visibility of the IngestionAdmin overlay
                onIngestionAdminOpen: function (event)
                {
                    if ( _.isUndefined(this.view.isClosed) || this.view.isClosed ) 
                    {  
                        App.viewContent.show(this.view);
                    }
                    else
                    {
                        this.view.close();
                    }
                }

            }); /* end of IngestionAdminT5Controller = Backbone.Marionette.Controller.extend() */

            return new IngestionAdminT5Controller();

        } /* end of function() */

    ); /* end of root.require() */

}).call( this );
