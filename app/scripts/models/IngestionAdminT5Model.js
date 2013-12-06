(function() 
{
    'use strict';

    var root = this;

    root.define(
        
        ['backbone','communicator'],

        function( Backbone, Communicator ) 
        {
            var IngestionAdminT5Model = Backbone.Model.extend(
                {
                    ToI:{},         // Time of Interest
                    AoI:[],         // Area of Interest
                    products: {}    // Selected products
                }
            );

            return {'IngestionAdminT5Model':IngestionAdminT5Model};

        }

    );

}).call( this );
