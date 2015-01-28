(function() {
	'use strict';

	var root = this;
	var query_args_scenario;
	var query_args;
	var opensearchKeywords;

	// TODO: Read the base_url from config.json.
	//var base_url = 'http://dream-nlr.nlr.nl/';
	var base_url = '';

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

				// Set the bounds of the displayed bbox
				// and enable/disable open-search button
				var aoi = this.model.get("AoI")
				if (aoi) {
					$("#txt-minx").val(aoi.left.toFixed(4));
					$("#txt-maxx").val(aoi.right.toFixed(4));
					$("#txt-miny").val(aoi.bottom.toFixed(4));
					$("#txt-maxy").val(aoi.top.toFixed(4));
					this.$("#btn-opensearch").removeAttr("disabled");
				} else {
					this.$("#btn-opensearch").attr("disabled", "disabled");
				}

				// disable scenario saving button
				this.$("#btn-savescenario").attr("disabled", "disabled");

				$(document).on('touch click', '#div-date-begin .input-group-addon', function(e){
				    $('input[type="text"]', $(this).parent()).focus();
				});
				$(document).on('touch click', '#div-date-end .input-group-addon', function(e){
				    $('input[type="text"]', $(this).parent()).focus();
				});
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
				var url = base_url+'scenario/manage?request=newOpenSearchScenario&q='+opensearchKeywords+'&'+query_args;
				// test url
				//var url = base_url+'scenario/manage?request=newOpenSearchScenario&bbox=49.2584,39.3913,51.8072,42.1379&startdate=2009-02-05T00:00:00&endDate=2009-02-06T00:00:00&maxrecord=10&subject=ASA_IMM_1P'
				
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
				// clear the WMS preview
				Communicator.mediator.trigger("map:preview:clear");

				// disable savescenario
				this.$("#btn-savescenario").attr("disabled", "disabled");

				// status bar
				$("#txt-opensearch").val("Searching....");

				// Opensearch selection 0= NLR, 1= FEDEO/MERIS and 2= FEDEO/ASAR 
				var selectionopensearch = $("#select-opensearch").val();
				// keywords for searching
				opensearchKeywords = $("#txt-opensearchkeywords").val();
				if (opensearchKeywords.length == 0) { opensearchKeywords = 'MER+ASA'; }
				// add list to dialoag
				var $openserachList = root.$("#list-opensearch");
				// remove item(s) out list
				$openserachList.children().remove();

				// get parameters
				var startDatestr = getISODateTimeString(this.model.get('ToI').start);
				var endDatestr = getISODateTimeString(this.model.get('ToI').end);
				var bbox = this.model.get("AoI");
	  			var AoIStr = String(bbox.left.toFixed(3))+','+String(bbox.bottom.toFixed(3))+','+String(bbox.right.toFixed(3))+','+String(bbox.top.toFixed(3));
				// set url parameters
				var params = { bbox:AoIStr, startdate:startDatestr, endDate:endDatestr, maxrecord:50 };
			

				// FEDEO search?
				if (parseInt(selectionopensearch) == 1){
					params.subject = "MER_FRS_1P";
				} else if (parseInt(selectionopensearch) == 2){
					params.subject = "ASA_IMM_1P";
				}

				function handleData(data , textStatus, jqXHR ) {

					var txtNumberOfResults = $(data).find("os\\:totalResults, totalResults").text();

					if (parseInt(txtNumberOfResults) > 0) {
						$("#txt-opensearch").val("Number of results: " + txtNumberOfResults);
						root.$("#btn-savescenario").removeAttr("disabled");
					} else {
						$("#txt-opensearch").val("No result found.");
						root.$("#btn-savescenario").attr("disabled", "disabled");
					}

					// get value for selection 0= NLR, 1= FEDEO/MERIS and 2= FEDEO/ASAR
					// WMS browses are available for NLR only.
					var selectionopensearch = $("#select-opensearch").val();

					// do for all entry's
					$(data).find('entry').each(function(index, entry){
						/* parse XML fragment */
						var temp_obj = {};
						temp_obj["coverageId"] = $(entry).find('title').text();

						var temp_data = $(entry).find('dc\\:date, date').text();
						var temp_arr =  temp_data.split('/');
						temp_obj["period"] = temp_arr[0] + '\n' + temp_arr[1];

						if (selectionopensearch == 0) {
							// parse WMS preview URL
							var link = $(entry).find('summary xh\\:a, a');
							var link_str = (link.prop('href'));

							if (link_str.length > 0) {
								temp_obj["browse_url"] = link_str
								temp_obj["wms_url"] = link_str.substr(0, link_str.indexOf('?'));

								_.each(link_str.split('&'), function(p){
									var temp_pair = p.split('=');
									if (temp_pair[0].toLowerCase() === 'layers'){
										temp_obj["wms_layers"] = temp_pair[1];
									}
								});
							}
						}

						// add entry to list
						var $html = $(SelectIcechartListItemTmpl(temp_obj));
						var $i = $html.find("i")
						$openserachList.append($html);
						$i.css("font-size","1em");
						$i.popover({
							trigger: "hover",
							html: true,
							content: IcechartInfoTmpl(temp_obj),
							title: "Information",
							placement: "bottom"
						});
						$i.click(function(){
							$openserachList.find("i").css("color","black")
							if((temp_obj["wms_url"])&&(temp_obj["wms_layers"])){
								$i.css("color","red")
								Communicator.mediator.trigger("map:preview:set", temp_obj["wms_url"], temp_obj["wms_layers"]);
							}
							return false;
						});
					});
				}

				query_args = jQuery.param( params );
				var url = base_url+'opensearch/opensearch?q='+opensearchKeywords+'&'+query_args;

				// get data from OpenSearch server NLR
				$.ajax({
					url : url,
					type: 'GET',
					dataType: 'xml',
					success: handleData,
					error: function(){
						$("#txt-opensearch").val("Catalogue query failed!");
						root.$("#btn-savescenario").attr("disabled", "disabled");
					}
				});
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
				// clear the WMS preview
				Communicator.mediator.trigger("map:preview:clear");
				this.close();
			}
			
		});
		return {'IceChartingView':IceChartingView};
	});

}).call( this );
