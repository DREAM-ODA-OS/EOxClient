(function() 
{
    'use strict';

    var root = this;

    root.define(
        
        ['backbone','communicator'],

        function( Backbone, Communicator ) 
        {
            var OrthoQualityModel = Backbone.Model.extend(
                {
                    ToI:{},         // Time of Interest
                    AoI:[],         // Area of Interest
                    products: {}    // Selected products
                }
            );

            return {'OrthoQualityModel':OrthoQualityModel};

        }

    );

}).call( this );
