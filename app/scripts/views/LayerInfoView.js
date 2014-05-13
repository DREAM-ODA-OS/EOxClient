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

                this.model.on('change:lonlat',this.update,this);
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

            update: function() {

                // local utilities

                function dec2dg(v,neg,pos){
                    var tmp = v;
                    var ltr = ( tmp >= 0 ? pos : neg );
                    var sgn = ( tmp >= 0 ? +1 : -1 ); tmp *= sgn ;
                    var dg = Math.floor(tmp) ; tmp = (tmp - dg)*60 ;
                    var mn = Math.floor(tmp) ; tmp = (tmp - mn)*60 ;

                    return dg+'&deg;&nbsp;'+mn+'&prime;&nbsp;'+tmp.toFixed(2)+'&Prime;&nbsp;'+ltr;
                }

                function getFirstValidResp( list ){
                    for ( var i = 0 ; i < list.length ; ++i ) {
                        if ( list[i].data ) { return list[i] ; }
                    }
                    return null ;
                }

                // update the view

                // click location
                var ll = this.model.get('lonlat') ;
                $('#layer-info-location-lon').html( ll ? dec2dg(ll.lon,'W','E') : 'n/a' );
                $('#layer-info-location-lat').html( ll ? dec2dg(ll.lat,'S','N') : 'n/a' );

                // content
                var prds = this.model.get('products');
                var rsp  = getFirstValidResp( this.model.get('responses') );

                var msg_common = "<br>Clict on the map to update this view."
                var msg = ( rsp ? '' : ( prds.length > 0 ? 'No feature has been selected.' :
                          'There is no layer selected.<br>Select one in the <strong>Layers</strong> overlay.')+msg_common);

                $('#layer-info-view-alert').html(msg)

                $('#layer-info-layer-name').html( rsp ? rsp.info.name : "n/a");
                $('#layer-info-layer-descr').html( rsp ? rsp.info.description : "n/a");

                // display layer's overlay
                if ( !rsp && prds.length == 0 ) {
                    Communicator.mediator.trigger('ui:open:layercontrol');
                }

                var frame = $('#layer-info-frame') ;

                if ( rsp && rsp.protocol == 'WMS' &&  rsp.request.type == 'GET' ) {
                    frame.css('display','block');
                    //frame.attr('src',rsp.request.url);
                    frame.attr('srcdoc',rsp.data); // HTML5 feature
                } else {
                    frame.css('display','none');
                    frame.attr('srcdoc','');
                    frame.attr('src','about:blank');
                }

            },

        });

        return {LayerInfoView:LayerInfoView};
    }

    root.define(deps,factory);

}).call( this );
