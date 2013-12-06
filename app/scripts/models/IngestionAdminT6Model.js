(function() 
{
    'use strict';

    var root = this;

    root.define(
        
        ['backbone','communicator'],

        function( Backbone, Communicator ) 
        {
            var IngestionAdminT6Model = Backbone.Model.extend(
                {
                    ToI:{},         // Time of Interest
                    AoI:[],         // Area of Interest
                    products: {}    // Selected products
                }
            );

            return {'IngestionAdminT6Model':IngestionAdminT6Model};

        }

    );

}).call( this );
