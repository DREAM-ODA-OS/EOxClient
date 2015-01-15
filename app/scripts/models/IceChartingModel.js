(function() {
    'use strict';
    var root = this;
    root.define(['backbone','communicator'],
    function(Backbone, Communicator){
        var IceChartingModel = Backbone.Model.extend({
            ToI: null,      // Time of Interest
            AoI: null,      // Area of Interest
            products: {}    // Selected products
        });
        return {'IceChartingModel':IceChartingModel};
    });
}).call( this );
