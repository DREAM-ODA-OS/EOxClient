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
            'models/OrthoQualityModel',
            'views/OrthoQualityView'
        ],

        function( Backbone, Communicator, globals, App, m, ds ) 
        {

            var OrthoQualityController = Backbone.Marionette.Controller.extend(
            {
                model: new m.OrthoQualityModel(), // instantiate the model 
                view: null,                           // 

                initialize: function(options)
                {
                    // model initialization: 

                    this.model.set('products', {});

                    // register events the component is listenning to: 

                    //this.listenTo(Communicator.mediator, "map:layer:change", this.onChangeLayer);
                    //this.listenTo(Communicator.mediator, 'time:change', this.onTimeChange);
                    //this.listenTo(Communicator.mediator, "selection:changed", this.onSelectionChange);
                    //this.listenTo(Communicator.mediator, "dialog:open:download", this.onDownloadToolOpen);
                    this.listenTo(Communicator.mediator, "dialog:open:orthoQuality", this.onOrthoQualityOpen);
            
                    // instantiate component's view
                    this.view = new ds.OrthoQualityView({model:this.model});
                },

                // event handlers ...

    /*
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
    */
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
    /*
                checkDownload: function() {
                    // Check that all necessary selections are available
                    if(this.model.get('ToI') != null &&
                       this.model.get('AoI') != null &&
                       _.size(this.model.get('products')) > 0){
                      Communicator.mediator.trigger('selection:enabled', {id:"download", enabled:true} );
                    }else{
                      Communicator.mediator.trigger('selection:enabled', {id:"download", enabled:false} );
                    }
                  },
    */
    /*
                onDownloadToolOpen: function(toOpen) {
                    if(toOpen){
                      App.viewContent.show(new v.DownloadView({model:this.model}));
                    }else{
                      App.viewContent.close();
                    }
                },
    */

                // toggle visibility of the OrthoQuality overlay
                onOrthoQualityOpen: function (event)
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

            }); /* end of OrthoQualityController = Backbone.Marionette.Controller.extend() */

            return new OrthoQualityController();

        } /* end of function() */

    ); /* end of root.require() */

}).call( this );
