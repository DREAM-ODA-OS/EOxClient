(function() {
  'use strict';

  var root = this;
  root.define([
    'backbone',
    'communicator',
    'globals',
    'hbs!tmpl/AddLocalProduct',
    'underscore'
  ],
  function( Backbone, Communicator, globals, AddLocalProductTmpl ) {

    var AddLocalProductView = Backbone.Marionette.ItemView.extend({
      tagName: "div",
      id: "modal-add-local-product",
      className: "panel panel-default add-local-product",
      template: {
          type: 'handlebars',
          template: AddLocalProductTmpl
      },

      modelEvents: {
      },

      events: {
      },

      initialize: function(options) {
      },

      onShow: function(view) {

        this.$('.close').on("click", _.bind(this.onClose, this));
        this.$el.draggable({ 
          containment: "#content",
          scroll: false,
          handle: '.panel-heading'
        });

       	var curr_sc_id = globals.objects.get('curr_sc_id');
        console.log('curr_sc_id =' + curr_sc_id);
        this.$('#sc_id').append('Add local Product to Scenario ' + curr_sc_id);

      },

      onStartDownloadClicked: function() {
        // for each selected coverage start a download
        var $downloads = $("#div-downloads"),
            options = {};

        var bbox = this.model.get("AoI").getBounds();
        options.subsetX = [bbox.left, bbox.right];
        options.subsetY = [bbox.bottom, bbox.top];

        // format + outputcrs
        options.format = this.$("#select-output-format").val();
        options.outputCRS = this.$("#select-output-crs").val();

        // apply mask parameter if polygon is not a square
        // (described by 5 points, first and last the same)
        var components = this.model.get("AoI").components[0].components;
        if(components.length>5){
          var coords = [];
          _.each(components, function(point) {
            coords.push(point.x);
            coords.push(point.y);
          });
          options.mask = coords.join(" ");
        }


        this.$('input[type="checkbox"]').each(_.bind(function(index) {
          if ($('input[type="checkbox"]')[index].checked){
            var model = this.coverages.models[index];
            var xml = getCoverageXML(model.get('coverageId'), options);

            var owsUrl = model.get('url').split('?')[0] + '?';

            var $form = $(CoverageDownloadPostTmpl({
              url: owsUrl, xml: xml}));
            $downloads.append($form);
            _.delay(function() {
            $form.submit();
            }, index * 1000);
          }
        }, this));
      },

      onClose: function() {
        Communicator.mediator.trigger("ui:close", "add-local-product");
        this.close();
      }

    });
    return {'AddLocalProductView':AddLocalProductView};
  });
}).call( this );
