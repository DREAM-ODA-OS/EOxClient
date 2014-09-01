//-------------------------------------------------------------------------------
//
// Project: EOxClient <https://github.com/EOX-A/EOxClient>
// Authors: Martin Paces <martin.paces@eox.at>
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

    var root = this ;

    var deps = [
        'backbone',
        'communicator',
        'globals',
        'hbs!tmpl/LayerInfo',
        'underscore'
    ];

    function factory( Backbone, Communicator, globals, LayerInfoTmpl ) {

        var LayerInfoView = Backbone.Marionette.CompositeView.extend({

            tagName: 'div',
            className: "panel panel-default layer-info not-selectable",
            template: {type: 'handlebars', template: LayerInfoTmpl},

            initialize: function() {

                this.model.on('change:responseExpected',this.update,this);
                this.model.on('change:lonlat',this.updateLonLat,this);
                this.model.on('change:responses',this.update,this);

            },

            onShow: function (view) {

            this.$('.close').on("click", _.bind(this.close, this));

            this.$el.draggable({
                containment: "#content" ,
                scroll: false,
                handle: '.panel-heading'
            });

                this.update();
            },

            onClose: function() {},

            updateLonLat: function() {

                function dec2dg(v,neg,pos){
                    var tmp = v;
                    var ltr = ( tmp >= 0 ? pos : neg );
                    var sgn = ( tmp >= 0 ? +1 : -1 ); tmp *= sgn ;
                    var dg = Math.floor(tmp) ; tmp = (tmp - dg)*60 ;
                    var mn = Math.floor(tmp) ; tmp = (tmp - mn)*60 ;

                    return dg+'&deg;&nbsp;'+mn+'&prime;&nbsp;'+tmp.toFixed(2)+'&Prime;&nbsp;'+ltr;
                }

                // update click location
                var ll = this.model.get('lonlat') ;
                $('#layer-info-location-lon').html( ll ? dec2dg(ll.lon,'W','E') : 'n/a' );
                $('#layer-info-location-lat').html( ll ? dec2dg(ll.lat,'S','N') : 'n/a' );
            },

            update: function() {

                function getFirstValidResp( list ){
                    for ( var i = 0 ; i < list.length ; ++i ) {
                        if ( list[i].data ) { return list[i] ; }
                    }
                    return null ;
                }

                // update the view
                var inProgress = this.model.get('responseExpected');
                var products = this.model.get('products');
                var response = getFirstValidResp( this.model.get('responses') );

                // abort update if no valid response received yet
                if ( inProgress && !response ) { $('#layer-info-view-alert').html("Query in progress ...") ; return ; }

                var msg_common = "<br>Clict on the map to update this view."
                var msg = ( response ? '' : ( products.length > 0 ? 'No feature has been selected.' :
                          'There is no layer selected.<br>Select one in the <strong>Layers</strong> overlay.')+msg_common);

                $('#layer-info-view-alert').html(msg)

                $('#layer-info-layer-name').html( response ? response.info.name : "n/a");
                $('#layer-info-layer-descr').html( response ? response.info.description : "n/a");

                // display layer's overlay
                if ( !response && products.length == 0 ) {
                    Communicator.mediator.trigger('ui:open:layercontrol');
                }

                var frame = $('#layer-info-frame') ;

                if (response && response.request.type == 'GET' && (response.protocol == 'WMS' || response.protocol == 'WPS')) {
                    frame.css('display','block');
                    frame.attr('srcdoc',response.data); // HTML5 feature - overides 'src' attribute when supported by the browser
                    frame.attr('src',response.request.url);
                } else {
                    frame.css('display','none');
                    frame.removeAttr('srcdoc');
                    frame.removeAttr('src')
                }

            },

        });

        return {LayerInfoView:LayerInfoView};
    }

    root.define(deps,factory);

}).call( this );
