(function() {
	'use strict';

	var root = this;
	var query_args_scenario;
	var query_args;
	var opensearchKeywords;

	root.define([
		'backbone',
		'communicator',
		'hbs!tmpl/IceCharting',
		'hbs!tmpl/SelectIcechartListItem',
	    'hbs!tmpl/IcechartInfo',
		'underscore',
		"bootstrap-datepicker"
	],


	function( Backbone, Communicator, IceChartingTmpl, SelectIcechartListItemTmpl, IcechartInfoTmpl ) {

		var IceChartingView = Backbone.Marionette.CompositeView.extend({  

			tagName: "div",
			className: "panel panel-default icecharting not-selectable",
			template: {type: 'handlebars', template: IceChartingTmpl},
			events: {
				'click #btn-draw-bbox':'onBBoxClick',
				"click #btn-clear-bbox" : 'onClearClick',
				"click #btn-savescenario" : 'onSavescenarioClick',
				"click #btn-opensearch" : 'onOpensearchClick',
				"change #txt-minx" : "onBBoxChange",
				"change #txt-maxx" : "onBBoxChange",
				"change #txt-miny" : "onBBoxChange",
				"change #txt-maxy" : "onBBoxChange",
				"hide": "onCloseTimeWidget"
			},


			
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


 		        var $openserachList = this.$("#list-opensearch");
		        $openserachList.children().remove();


		    	this.$('#div-date-begin input[type="text"]').datepicker({autoclose: true, format: "yyyy-mm-dd", keyboardNavigation: false});
		    	this.$('#div-date-begin input[type="text"]').datepicker('update', this.model.get('ToI').start);
		    	this.$('#div-date-begin input[type="text"]').datepicker('setDate', this.model.get('ToI').start);

		    	this.$('#div-date-end input[type="text"]').datepicker({autoclose: true, format: "yyyy-mm-dd", keyboardNavigation: false});
		    	this.$('#div-date-end input[type="text"]').datepicker('update', this.model.get('ToI').end);
				this.$('#div-date-end input[type="text"]').datepicker('setDate', this.model.get('ToI').end);
				// disable all button's
				this.$("#btn-opensearch").attr("disabled", "disabled");
				this.$("#btn-savescenario").attr("disabled", "disabled");

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
				this.$("#btn-savescenario").attr("disabled", "disabled");
				// clear opensearch List
				var $openserachList = root.$("#list-opensearch");
				// remove item(s) out list
				$openserachList.children().remove();
			},
	
			onSavescenarioClick: function () {
				// proxy
				// save scenario, same url as OpenSearch
				var url = 'scenario/manage?request=newOpenSearchScenario&q='+opensearchKeywords+'&'+query_args;
				// test url
				//var url = 'scenario/manage?request=newOpenSearchScenario&bbox=48.397,42.590,53.770,46.567&startdate=2010-01-10T00:00:00&endDate=2011-01-10T00:00:00&maxrecord=10&subject=RRS'
				
				function getJsonData() {
					return $.ajax({
						url : url,
						type: 'GET',
						dataType: 'json'
					});
				}


				function handleJsonData(data , textStatus, jqXHR ) {
					
					var obj = $.parseJSON( JSON.stringify(data) ); 
					// status bar response example from request: {"status":0,"ncn_id":"scid17"}
					if (obj.status == 0){
						$("#txt-opensearch").val("Scenario-id: "+obj.ncn_id);
					} else {
						$("#txt-opensearch").val("Scenario error: "+obj.status);
					}
				}

				// get scenario-id from NLR
				getJsonData().done(handleJsonData);
				
			},

			onOpensearchClick: function () {
				// disable savescenario
				this.$("#btn-savescenario").attr("disabled", "disabled");

				// status bar
				$("#txt-opensearch").val("Searching....");

				// Opensearch selection 0= NLR, 1= FEDEO/MERIS and 2= FEDEO/ASAR 
				var selectionopensearch = $("#select-opensearch").val();
				// keywords for searching
				opensearchKeywords = $("#txt-opensearchkeywords").val();
				if (opensearchKeywords.length == 0) { opensearchKeywords = 'MERIS+ASAR'; }
				// add list to dialoag
				var $openserachList = root.$("#list-opensearch");
				// remove item(s) out list
				$openserachList.children().remove();

				// get parameters
				var startDatestr = getISODateTimeString(this.model.get('ToI').start);
				var endDatestr = getISODateTimeString(this.model.get('ToI').end);
				var bbox = this.model.get("AoI").getBounds();
				var AoIStr = String(bbox.left.toFixed(3))+','+String(bbox.bottom.toFixed(3))+','+String(bbox.right.toFixed(3))+','+String(bbox.top.toFixed(3));
				// set url parameters
				var params = { bbox:AoIStr, startdate:startDatestr, endDate:endDatestr, maxrecord:50 };

				// FEDEO search?
				if (parseInt(selectionopensearch) == 1){
					params.subject = "MER_FRS_1P";
				} else if (parseInt(selectionopensearch) == 2){
					params.subject = "ASA_IMM_1P";
				}
				query_args = jQuery.param( params );

				// proxy
				var url = 'opensearch/opensearch?q='+opensearchKeywords+'&'+query_args;
			
				function getData() {
					return $.ajax({
						url : url,
						type: 'GET',
						dataType: 'xml'
					});
				}
				

				function handleData(data , textStatus, jqXHR ) {

					// get number of results					
					var txtNumberResults = $(data).find("os\\:totalResults").text();
					var intNumberResults = parseInt(txtNumberResults);

					if ( intNumberResults > 0) {
						// init object
						var jsonObj = [];

						// do for all entry's
						$(data).find('entry').each(function(){
							/* Parse the XML File */
							var temp_obj = {};
							temp_obj["coverageId"] = $(this).find('title').text();
							var temp_data = $(this).find('dc\\:date').text();
							var arr =  temp_data.split('/');
							temp_obj["period"] = arr[0] +'\n'+arr[1];
							jsonObj.push(temp_obj);

		 			   	});

						if (jsonObj.length > 0){
							// display number of search results
							$("#txt-opensearch").val("Number of results: "+(txtNumberResults));
							// enable savescenario
							root.$("#btn-savescenario").removeAttr("disabled");

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
						} else {
							$("#txt-opensearch").val("No results");
						}
					} else {
						$("#txt-opensearch").val("No results");
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
					//this.$("#btn-savescenario").removeAttr("disabled");
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
				this.$("#btn-savescenario").attr("disabled", "disabled");

				if(!isNaN(values.left) && !isNaN(values.right) &&
					!isNaN(values.bottom) && !isNaN(values.top) ) {
					
					if ( !(values.left > values.right || values.bottom > values.top)){
						Communicator.mediator.trigger('selection:bbox:changed',values);
						// enable all button's
						this.$("#btn-opensearch").removeAttr("disabled");
						//this.$("#btn-savescenario").removeAttr("disabled");
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
