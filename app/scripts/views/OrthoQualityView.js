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
    'hbs!tmpl/OrthoQuality',
    'hbs!tmpl/SelectCoverageListItem',
    'hbs!tmpl/CoverageInfo',
    'hbs!tmpl/CoverageDownloadPost',
    'underscore'
  ],
  function( Backbone, Communicator, globals, m, OrthoQualityTmpl,
   SelectCoverageListItemTmpl, CoverageInfoTmpl,CoverageDownloadPostTmpl) {

    function getQUrl(key) {
        var q_options = globals.objects.get('orthoQualityConfig');
        return q_options[key];
    };

    var OrthoQualityView = Backbone.Marionette.ItemView.extend({
      tagName: "div",
      id: "modal-start-otrhoquality",
      className: "panel panel-default download",
      template: {
          type: 'handlebars',
          template: OrthoQualityTmpl
      },

      modelEvents: {
        "reset": "onCoveragesReset"
      },

      events: {
        //"click #btn-select-all-coverages": "onSelectAllCoveragesClicked",
        //"click #btn-invert-coverage-selection": "onInvertCoverageSelectionClicked",
        "click #btn-refresh-dq-list": "onRefreshClick",
        "click #btn-modify-dq-selection": "onModifyClick",
        //"click #btn-start-download": "onStartDownloadClicked"
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

        this.$('#btn-q-improve').on("click", _.bind(this.onImprove, this));
        this.$('#btn-q-assess').on("click", _.bind(this.onAssess, this));

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
        Communicator.mediator.trigger("dialog:open:orthoQuality", false);
        Communicator.mediator.trigger("dialog:open:orthoQuality", true);
      },

      onModifyClick: function () {
        Communicator.mediator.trigger("dialog:open:orthoQuality", false);
        this.close();
        Communicator.mediator.trigger("dialog:open:orthoQualitySelection");
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

      getProductsList: function() {
        // for each selected coverage start a quality process
        var $downloads = $("#div-downloads");
        var options = {};

        var bbox = this.model.get("AoI");
        if (this.$('#select-output-clipping').is(":checked")) {
            options.subsetX = [bbox.left, bbox.right];
            options.subsetY = [bbox.bottom, bbox.top];
        }

        var cbx_list = this.$("#download-list").find('input[type="checkbox"]') ;

        var products = []
        cbx_list.each(_.bind(function(index) {
          if (cbx_list[index].checked){
            var model = this.coverages.models[index];
            //options.coverageSubtype = model.get('coverageSubtype');
            var coverageId = model.get('coverageId');
            console.log("coverageId: "+coverageId);
            products.push(coverageId);
          }
        }, this));

        return products;
      },

      onImprove: function ()
      {
          var product = this.getProductsList()[0];  // take the first one

          var resolution = this.$("#select-resolution").val(); //5;
          var crs_code   = this.$("#select-output-crs").val(); //'EPSG:32631';

          if (null == product) {
              alert('No product selected');
              return;
          }
          
          var qw_url = getQUrl('qtmpUrl') + "?qop=i" +
                   "&res="+resolution+
                   "&crs="+crs_code+
                   "&prod="+product;
          window.open(qw_url, "", "width=390,height=280,resizable=1");

          /*
          var jqr = $.ajax({
                  url: getQUrl('qtmpUrl'),
                  data: {
                      qop: "i",
                      res: resolution,
                      crs: crs_code,
                      prod: product
                  },
                  error : function(ret_jqxhr, status, err){
                      console.log("improveQuality request failed; st="+status);
                      console.log("improveQuality err: "+err);
                      alert("improveQuality request failed: '"+status+"'");
                  },
                  success : function(data, status, ret_jqxhr){
                      console.log("invoked improveQuality on server, st="+status);
                      alert("improveQuality asynch running: "+status);
                  },
                  complete : function(ret_jqxhr, status ){
                      console.log("improveQuality req status:"+status);
                  }
              });
          */
      },

      onAssess: function ()
      {
          var product = this.getProductsList()[0];  // take the first one
          if (null == product) {
              alert('No product selected');
              return;
          }
          var qw_url = getQUrl('qtmpUrl') + "?qop=a" +
                   "&prod="+product;
          window.open(qw_url, "", "width=390,height=280,resizable=1");
      },

      onClose: function() {
                //Communicator.mediator.trigger("ui:close", "download");
        this.close();
      }

    });
    return {'OrthoQualityView':OrthoQualityView};
  });
}).call( this );
