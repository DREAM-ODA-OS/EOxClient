(function() {
	'use strict';

	var root = this;

	root.define([
		'backbone',
		'communicator',
		'hbs!tmpl/IceCharting',
		'hbs!tmpl/SelectIcechartListItem',
	    'hbs!tmpl/IcechartInfo',
		'underscore',
		"bootstrap-datepicker"
	],

	//function( Backbone, Communicator, DownloadSelectionTmpl ) {
	function( Backbone, Communicator, IceChartingTmpl, SelectIcechartListItemTmpl, IcechartInfoTmpl ) {

		var IceChartingView = Backbone.Marionette.CompositeView.extend({  

			tagName: "div",
			className: "panel panel-default downloadselection not-selectable",
			template: {type: 'handlebars', template: IceChartingTmpl},
			events: {
				'click #btn-draw-bbox':'onBBoxClick',
				"click #btn-clear-bbox" : 'onClearClick',
				"click #btn-download" : 'onDownloadClick',
				"click #btn-saveconfig" : 'onSaveconfigClick',
				"click #btn-opensearch" : 'onOpensearchClick',
				"change #txt-minx" : "onBBoxChange",
				"change #txt-maxx" : "onBBoxChange",
				"change #txt-miny" : "onBBoxChange",
				"change #txt-maxy" : "onBBoxChange",
				"hide": "onCloseTimeWidget"
			},


            change_pending : false,
			
			onShow: function (view) {

				this.listenTo(Communicator.mediator, 'time:change', this.onTimeChange);
	        	this.listenTo(Communicator.mediator, "selection:changed", this.onSelectionChange);

	        	this.timeinterval = {};

	        	this.delegateEvents(this.events);

				this.$('.close').on("click", _.bind(this.onClose, this));
				this.$el.draggable({ 
		    		containment: "#content" ,
		    		scroll: false,
		    		handle: '.panel-heading'
		    	});


 		        var $openserachList = this.$("#opensearch-list");
		        $openserachList.children().remove();


		    	this.$('#div-date-begin input[type="text"]').datepicker({autoclose: true, format: "yyyy-mm-dd", keyboardNavigation: false});
		    	this.$('#div-date-begin input[type="text"]').datepicker('update', this.model.get('ToI').start);
		    	this.$('#div-date-begin input[type="text"]').datepicker('setDate', this.model.get('ToI').start);

		    	this.$('#div-date-end input[type="text"]').datepicker({autoclose: true, format: "yyyy-mm-dd", keyboardNavigation: false});
		    	this.$('#div-date-end input[type="text"]').datepicker('update', this.model.get('ToI').end);
				this.$('#div-date-end input[type="text"]').datepicker('setDate', this.model.get('ToI').end);
				// disable all button's
				this.$("#btn-opensearch").attr("disabled", "disabled");
				this.$("#btn-saveconfig").attr("disabled", "disabled");
				this.$("#btn-download").attr("disabled", "disabled");

				$(document).on('touch click', '#div-date-begin .input-group-addon', function(e){
				    $('input[type="text"]', $(this).parent()).focus();
				});
				$(document).on('touch click', '#div-date-end .input-group-addon', function(e){
				    $('input[type="text"]', $(this).parent()).focus();
				});
htmlTemplate
			},


			onBBoxClick: function() {
				$("#txt-minx").val("");
				$("#txt-maxx").val("");
				$("#txt-miny").val("");
				$("#txt-maxy").val("");
				Communicator.mediator.trigger('selection:activated',{id:"bboxSelection",active:true});
			},

			onClearClick: function () {
				Communicator.mediator.trigger('selection:activated',{id:"bboxSelection",active:false});
				$("#txt-minx").val("");
				$("#txt-maxx").val("");
				$("#txt-miny").val("");
				$("#txt-maxy").val("");
				// disable all button's
				this.$("#btn-opensearch").attr("disabled", "disabled");
				this.$("#btn-saveconfig").attr("disabled", "disabled");
				this.$("#btn-download").attr("disabled", "disabled");
				// clear opensearch List
				var $openserachList = root.$("#opensearch-list");
				// remove item(s) out list
				$openserachList.children().remove();
			},

			onDownloadClick: function () {
				Communicator.mediator.trigger("dialog:open:download", true);
			},


			onSaveconfigClick: function () {

				var startDatestr = getISODateTimeString(this.model.get('ToI').start);
				var endDatestr = getISODateTimeString(this.model.get('ToI').end);

				var bbox = this.model.get("AoI").getBounds();

				if(!isNaN(bbox.left) && !isNaN(bbox.right) &&
					!isNaN(bbox.bottom) && !isNaN(bbox.top) ) {
					
					if ( !(bbox.left > bbox.right || bbox.bottom > bbox.top)){

 						// make XML stream for batch configuration file.
						var blob = new Blob([getConfigDataXML(startDatestr, endDatestr, bbox)], {type: "text/plain;charset=utf-8"});
						saveAs(blob, "dream.xml");
						
					}
				}
			},

			onOpensearchClick: function () {

				// add list to dialoag
				var $openserachList = root.$("#opensearch-list");
				// remove item(s) out list
				$openserachList.children().remove();

				// get parameters
				var startDatestr = getISODateTimeString(this.model.get('ToI').start);
				var endDatestr = getISODateTimeString(this.model.get('ToI').end);
				var bbox = this.model.get("AoI").getBounds();
				var AoIStr = String(bbox.left.toFixed(3))+','+String(bbox.bottom.toFixed(3))+','+String(bbox.right.toFixed(3))+','+String(bbox.top.toFixed(3));
				// set url parameters
				var params = { bbox:AoIStr, startdate:startDatestr, endDate:endDatestr, maxrecord:10 };
				var query_args = jQuery.param( params );
				var url = '/opensearch/opensearch?'+query_args;
			
				//var url = '/opensearch/opensearch?&startdate=2008-03-08T00:00:00.00Z&enddate=2008-03-08T23:99:99.00Z';
			
				function getData() {
					return $.ajax({
						url : url,
						type: 'GET',
						dataType: 'xml'
					});
				}
				

				function handleData(data , textStatus, jqXHR ) {

					var jsonObj = [];

					// do for all entry's
					$(data).find('entry').each(function(){
						/* Parse the XML File */
						//var title = $(this).find('title').text();
						//var timeupdated = $(this).find('updated').text();

						var temp_obj = {};
						temp_obj["coverageId"] = $(this).find('title').text();
					    temp_obj["updated"] = $(this).find('updated').text();
						jsonObj.push(temp_obj);

	 			   	});


					// add entry's to list
					for (var i = 0; i < jsonObj.length; i++) {
						var $html = $(SelectIcechartListItemTmpl(jsonObj[i]));
						$openserachList.append($html);
						$html.find("i").popover({
							trigger: "hover",
							html: true,
							content: IcechartInfoTmpl(jsonObj[i]),
							title: "Information",
							placement: "bottom"
						});
					}
				}

				// get data from OpenSearch server NLR
				getData().done(handleData);

			},

			onTimeChange: function (time) {
		    	this.$('#div-date-begin input[type="text"]').datepicker('update', this.model.get('ToI').start);
		    	this.$('#div-date-end input[type="text"]').datepicker('update', this.model.get('ToI').end);
			},


			onCloseTimeWidget: function(evt){
				var opt = {
					start: this.$('#div-date-begin input[type="text"]').datepicker('getDate'),
					end: this.$('#div-date-end input[type="text"]').datepicker('getDate')
				};
				Communicator.mediator.trigger('date:selection:change', opt);
			},

			onSelectionChange: function (obj) {
				if (obj){
					$("#txt-minx").val(obj.bounds.left.toFixed(4));
					$("#txt-maxx").val(obj.bounds.right.toFixed(4));
					$("#txt-miny").val(obj.bounds.bottom.toFixed(4));
					$("#txt-maxy").val(obj.bounds.top.toFixed(4));
					// enable all button's
					this.$("#btn-opensearch").removeAttr("disabled");
					this.$("#btn-saveconfig").removeAttr("disabled");
					this.$("#btn-download").removeAttr("disabled");
				}
				
			},

			onBBoxChange: function (event) {

				var values = {
					left: parseFloat($("#txt-minx").val()),
					right: parseFloat($("#txt-maxx").val()),
					bottom: parseFloat($("#txt-miny").val()),
					top: parseFloat($("#txt-maxy").val())
				};
				
				// disable all button's
				this.$("#btn-opensearch").attr("disabled", "disabled");
				this.$("#btn-saveconfig").attr("disabled", "disabled");
				this.$("#btn-download").attr("disabled", "disabled");

				if(!isNaN(values.left) && !isNaN(values.right) &&
					!isNaN(values.bottom) && !isNaN(values.top) ) {
					
					if ( !(values.left > values.right || values.bottom > values.top)){
						Communicator.mediator.trigger('selection:bbox:changed',values);
						// enable all button's
						this.$("#btn-opensearch").removeAttr("disabled");
						this.$("#btn-saveconfig").removeAttr("disabled");
						this.$("#btn-download").removeAttr("disabled");
					}
				}
			},


			onClose: function() {
				this.close();
			}
			
		});
		return {'IceChartingView':IceChartingView};
	});

}).call( this );
