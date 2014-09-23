//-------------------------------------------------------------------------------
//
// Project: EOxClient <https://github.com/EOX-A/EOxClient>
// Authors: Daniel Santillan <daniel.santillan@eox.at>
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

  // Helper collection to keep maintain data of coverage set
  var EOCoverageSet = Backbone.Collection.extend({
    fetch: function(options) {
      options || (options = {});
      options.dataType = "xml";
      return Backbone.Collection.prototype.fetch.call(this, options);
    },
    parse: function(response) {
      return WCS.Core.Parse.parse(response).coverageDescriptions;
    },
  });

  var root = this;
  root.define([
    'backbone',
    'communicator',
    'globals',
    'models/DownloadModel',
    'hbs!tmpl/Download',
    'hbs!tmpl/SelectCoverageListItem',
    'hbs!tmpl/CoverageInfo',
    'hbs!tmpl/CoverageDownloadPost',
    'underscore'
  ],
  function( Backbone, Communicator, globals, m, DownloadTmpl,
   SelectCoverageListItemTmpl, CoverageInfoTmpl,CoverageDownloadPostTmpl) {

    var DownloadView = Backbone.Marionette.ItemView.extend({
      tagName: "div",
      id: "modal-start-download",
      className: "panel panel-default download",
      template: {
          type: 'handlebars',
          template: DownloadTmpl
      },

      modelEvents: {
        "reset": "onCoveragesReset"
      },

      events: {
        "click #btn-select-all-coverages": "onSelectAllCoveragesClicked",
        "click #btn-invert-coverage-selection": "onInvertCoverageSelectionClicked",
        "click #btn-refresh-list": "onRefreshClick",
        "click #btn-modify-selection": "onModifyClick",
        'change input[type="checkbox"]': "onCoverageSelected",
        "click #btn-start-download": "onStartDownloadClicked"
      },

      initialize: function(options) {
        this.coverages = new Backbone.Collection([]);
      },

      onShow: function(view){

        this.$('#download-alert').html("Search in progress ...");

        this.listenTo(this.coverages, "reset", this.onCoveragesReset);
        this.$('.close').on("click", _.bind(this.onClose, this));
        this.$el.draggable({ 
          containment: "#content",
          scroll: false,
          handle: '.panel-heading'
        });

        var $downloadList = this.$("#download-list");
        $downloadList.children().remove();


        var coverageSets = _.map(this.model.get('products'), function(product, key) {
          var set = new EOCoverageSet([]);
          var options = {};

          if(product.get('timeSlider')){
            options = {
                subsetTime: [
                  getISODateTimeString(this.model.get("ToI").start),
                  getISODateTimeString(this.model.get("ToI").end)
                ]
            };
          } //TODO: Check what to set if timeslider not activated

          options.subsetCRS = "http://www.opengis.net/def/crs/EPSG/0/4326";
          var bbox = this.model.get("AoI");
          options.subsetX = [bbox.left, bbox.right];
          options.subsetY = [bbox.bottom, bbox.top];

          // TODO: Check for download protocol !
          set.url = WCS.EO.KVP.describeEOCoverageSetURL(product.get('download').url, key, options);
          return set;
        }, this);

        // dispatch WCS DescribeEOCoverageSet requests
        var deferreds = _.invoke(coverageSets, "fetch");

        $.when.apply($, deferreds).done(_.bind(function() {
          _.each(coverageSets, function(set) {
            set.each(function(model) {
              model.set("url", set.url)
            });
          });
          var coverage = _.flatten(_.pluck(coverageSets, "models"));
          this.coverages.reset(coverage);
        }, this));
      },

			onRefreshClick: function () {
				Communicator.mediator.trigger("dialog:open:download", false);
				Communicator.mediator.trigger("dialog:open:download", true);
			},

			onModifyClick: function () {
				Communicator.mediator.trigger("dialog:open:download", false);
				Communicator.mediator.trigger("dialog:open:downloadSelection");
			},

      onSelectAllCoveragesClicked: function() {
        // select all coverages
        this.$('input[type="checkbox"]').prop("checked", true).trigger("change");
      },

      onInvertCoverageSelectionClicked: function() {
        this.$('input[type="checkbox"]').each(function() {
          var $this = $(this);
          $this.prop("checked", !$this.is(":checked")).trigger("change");
        });
      },

      onCoveragesReset: function() {
        var $downloadList = this.$("#download-list");
        var $infoFrame = this.$("#download-info-frame");
        var layers = globals.products.filter(function(model) { return model.get('visible'); });

        this.$('#download-alert').html(this.coverages.length > 0 ? "" : "No coverage matching the selection found.");

        this.coverages.each(function(coverage) {
          var coverageJSON = coverage.toJSON();
          var $html = $(SelectCoverageListItemTmpl(coverageJSON));
          var infoURL = coverage.get('url').split('?')[0] +
              "?SERVICE=WPS&VERSION=1.0.0&REQUEST=Execute&IDENTIFIER=getCoverageInfo" +
              "&RawDataOutput=info&DATAINPUTS=identifier%3D" + coverage.get("coverageId")
          $downloadList.append($html);
          if (coverage.get("coverageSubtype") != "RectifiedDataset") {
            $html.find("#cov-info-flag").html("&nbsp;[RAW]")
          }
          $html.find("i").popover({
            trigger: "hover",
            html: true,
            content: CoverageInfoTmpl(coverageJSON),
            title: "Coverage Description",
            placement: "bottom"
          });
          var $i = $html.find("i")
          $i.css("font-size","1em")
          $i.click(function(){
            $downloadList.find("i").css("color","black")
            $i.css("color","red")
            //$infoFrame.attr('srcdoc',response.data); // HTML5 feature - overides 'src' attribute when supported by the browser
            $infoFrame.attr('src', infoURL);
            return false;
          });
        }, this);
      },

      onCoverageSelected: function() {
        // check that at least one coverage was selected
        if (this.$("input:checked").length) {
          this.$("#btn-start-download").removeAttr("disabled");
        }
        else {
          this.$("#btn-start-download").attr("disabled", "disabled");
        }
      },

      onStartDownloadClicked: function() {
        // for each selected coverage start a download
        var $downloads = $("#div-downloads");
        var options = {};

        var bbox = this.model.get("AoI");
        if (this.$('#select-output-clipping').is(":checked")) {
            options.subsetX = [bbox.left, bbox.right];
            options.subsetY = [bbox.bottom, bbox.top];
        }

        // format + outputcrs
        options.format = this.$("#select-output-format").val();
        options.outputCRS = this.$("#select-output-crs").val();

        // apply mask parameter if polygon is not a square
        // (described by 5 points, first and last the same)
        /*
        var components = this.model.get("AoI").components[0].components;
        if(components.length>5){
          var coords = [];
          _.each(components, function(point) {
            coords.push(point.x);
            coords.push(point.y);
          });
          options.mask = coords.join(" ");
        }
        */

        // Raise an alert in case of non-native output-CRS applied for referenceable data-sets.
        var cbx_list = this.$("#download-list").find('input[type="checkbox"]') ;
        if (options.outputCRS) {
          var refds_count = 0;
          cbx_list.each(_.bind(function(index) {
            if (cbx_list[index].checked){
              if( this.coverages.models[index].get('coverageSubtype') != "RectifiedDataset"){
                  refds_count += 1;
              }
            }
          }, this));
          if (refds_count) {
            window.alert("The download selection contains referenceable datasets (i.e., non-orthorectified RAW products). "+
                " The selected output CRS cannot be applied to these datasets and they will be delivered in their native RAW geometry.");
          }
        }

        // raise an alert in case of JP2000 requests
        if (options.format == 'image/jp2')
        {
            window.alert("JP2000 download is limited to 8bit Grayscale or RGB imagery.  The number of bands is therefore "+
                "reduced to 1 or 3.  12 or 16bits output is not supported.  \nThe current draft of the WCS JP2000 encoding specification "+
                "does not define a way how to pass any encoding parameters (e.g., quality factor).  The imagery is encoded using the "+
                "server default values.");
        }

        // JP2000 RGB range subsetting
        var _jp2_rgb = function(rtlist){
            if (!rtlist.length) { return rtlist; }
            if (rtlist.length < 3) { return [rtlist[0]]; }

            //Try to interpret the range-type.
            var idx_red = rtlist.indexOf('Red');
            var idx_green = rtlist.indexOf('Green');
            var idx_blue = rtlist.indexOf('Blue');
            var idx_nir = rtlist.indexOf('NIR');

            if ((idx_blue >= 0) && (idx_green >= 0) && (idx_red >= 0)) {
                return ['Red', 'Green', 'Blue'] ;
            }

            if ((idx_nir >= 0) && (idx_green >= 0) && (idx_red >= 0)) {
                return ['NIR', 'Red', 'Green'];
            }

            // Fallback to the firts 3 bands.
            return [rtlist[0],rtlist[1],rtlist[2]];
        }

        options.format = this.$("#select-output-format").val();

        cbx_list.each(_.bind(function(index) {
          if (cbx_list[index].checked){
            var model = this.coverages.models[index];
            options.coverageSubtype = model.get('coverageSubtype');
            if (options.format == 'image/jp2')
                options.rangeSubset = _jp2_rgb(_.map(model.get('rangeType'), function(rt) { return rt.name } ));
            else {
                options.rangeSubset = null ;
            }
            var xml = getCoverageXML(model.get('coverageId'), options);
            var owsUrl = model.get('url').split('?')[0];
            var $form = $(CoverageDownloadPostTmpl({url: owsUrl, xml: xml}));
            $downloads.append($form);
            _.delay(function() {
            $form.submit();
            }, index * 1000);
          }
        }, this));
      },

      onClose: function() {
        Communicator.mediator.trigger("ui:close", "download");
        this.close();
      }

    });
    return {'DownloadView':DownloadView};
  });
}).call( this );
