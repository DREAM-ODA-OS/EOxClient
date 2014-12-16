(function() 
{
    'use strict';

    var root = this;

    root.define(
        
        ['backbone','communicator', 'text!../../config.json'],

        function( Backbone, Communicator, Config )
        {
            var config_src = JSON.parse(Config);
            var url_src =
                config_src.ingestionEngineT5.baseUrl +
                config_src.ingestionEngineT5.listScenario;
            var IngestionAdminT5Model = Backbone.Model.extend(
                {
                    failure: false,
                    url: url_src,
                    ToI:{},          // Time of Interest
                    AoI:[],          // Area of Interest
                    scenarios: null  // Defined Scenarios
                }
            );

            return {'IngestionAdminT5Model':IngestionAdminT5Model};

        }

    );

}).call( this );
