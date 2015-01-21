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
            'models/IceChartingModel',
            'views/IceChartingView'
        ],

        function( Backbone, Communicator, globals, App, m, ds ) 
        {

            var IceChartingController = Backbone.Marionette.Controller.extend(
            {
                model: new m.IceChartingModel(), // instantiate the model 
                view: null,                           // 

                initialize: function(options)
                {
                    // model initialization: 

                    this.model.set('products', {});

                    // register events the component is listenning to: 

                    this.listenTo(Communicator.mediator, "map:layer:change", this.onChangeLayer);
                    this.listenTo(Communicator.mediator, 'time:change', this.onTimeChange);
                    this.listenTo(Communicator.mediator, "selection:changed", this.onSelectionChange);
                    this.listenTo(Communicator.mediator, "selection:bbox:changed", this.onBBoxChange);
                    this.listenTo(Communicator.mediator, "dialog:open:download", this.onDownloadToolOpen);
                    this.listenTo(Communicator.mediator, "dialog:open:iceCharting", this.onIceChartingOpen);
            
                    // instantiate component's view
                    this.view = new ds.IceChartingView({model:this.model});
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
    
    
                onDownloadToolOpen: function(toOpen) {
                    if(toOpen){
                      App.viewContent.show(new v.DownloadView({model:this.model}));
                    }else{
                      App.viewContent.close();
                    }
                },
    

                // toggle visibility of the IceCharting overlay
                onIceChartingOpen: function (event)
                {
                    // clear the WMS preview
                    Communicator.mediator.trigger("map:preview:clear");

                    if ( _.isUndefined(this.view.isClosed) || this.view.isClosed ) 
                    {  
                        App.viewContent.show(this.view);
                    }
                    else
                    {
                        this.view.close();
                    }
                }

            }); /* end of IceChartingController = Backbone.Marionette.Controller.extend() */

            return new IceChartingController();

        } /* end of function() */

    ); /* end of root.require() */

}).call( this );
