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
            'views/AddLocalProductView'
        ],

        function( Backbone, Communicator, globals, App, Views )
        {

            var AddLocalProductController = Backbone.Marionette.Controller.extend(
            {
                initialize: function(options)
                {
                    this.listenTo(Communicator.mediator, "dialog:open:add-local-product", this.onAddLocalProductOpen);
            
                    // instantiate component's view
                    this.view = new Views.AddLocalProductView();
                },

                // toggle visibility of the IngestionAdmin overlay
                onAddLocalProductOpen: function (event)
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

            }); /* end of AddLocalProductController = Backbone.Marionette.Controller.extend() */

            return new AddLocalProductController();

        } /* end of function() */

    ); /* end of root.require() */

}).call( this );
