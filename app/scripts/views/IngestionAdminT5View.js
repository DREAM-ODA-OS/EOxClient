/*  Project: DREAM
 *  Module:  Task 5 ODA Ingestion Admin Pages in the ODA Client
 *  Authors:  Milan Novacek (CVC), Radim Zajonc (CVC)
 *  loosely based on ODA Client code templates by Martin Paces (EOX).
 *
 *    (c) 2014 Siemens Convergence Creators s.r.o. (CVC), Prague
 *    Licensed under the 'DREAM ODA Ingestion Engine Open License'
 *    (see the file 'LICENSE' in the top-level directory
 *     of the Ingestion Engine)
 *
 */

(function() 
{
    'use strict';

    var root = this;

    root.define(
    
        [
            'backbone',
            'communicator',
            'hbs!tmpl/IngestionAdminT5',
            'globals',
            'underscore',
            'bootstrap-datepicker'
        ],

        function( Backbone, Communicator, IngestionAdminT5Tmpl, globals )
        {

            var IngestionAdminT5View = Backbone.Marionette.CompositeView.extend(
            {  

                tagName: "div",
                className: "panel panel-default ingestion-overview not-selectable",
                
                template: {type: 'handlebars', template: IngestionAdminT5Tmpl},
                /*
                modelEvents: {
                    "change": "onModelChange" 
                },
                */

                events:
                {
                    /*
                    'click #btn-draw-bbox':'onBBoxClick',
                    "click #btn-clear-bbox" : 'onClearClick',
                    "click #btn-download" : 'onDownloadClick',
                    "change #txt-minx" : "onBBoxChange",
                    "change #txt-maxx" : "onBBoxChange",
                    "change #txt-miny" : "onBBoxChange",
                    "change #txt-maxy" : "onBBoxChange",
                    'changeDate': "onChangeDate"
                    */
                },

                updater        : {},
                is_showing     : false,
                change_pending : false,

                get_scenario_st : function(that, sc_id, ncn_id) {
                    var scenarios = that.model.get('scenarios');
                    for (var i=0; i<scenarios.length; i++)
                    {
                        if (scenarios[i].id == sc_id && scenarios[i].ncn_id == ncn_id) {
                            return scenarios[i];
                        }
                    }
                    console.log("IngAdmT5: scenario data not found, ncn_id:" + ncn_id);
                    return null;
                },

                set_scenarios_html : function(that) {
                    if (! that.is_showing ) { return; }
                    var scenarios = that.model.get('scenarios'); 
                    var scenarioHTML = '';
                    for (var i=0; i<scenarios.length; i++)
                    {
                        var ncn_id = scenarios[i].ncn_id;
                        scenarioHTML +=
                            '<table width="100%" frame="void">' +
                            '<tr>' +

                            // buttons
                            '<td width=19%>' +
                            // ingest
                            '<button type="button" class="btn btn-default" ' +
                                'id="btn-ingest-scenario-' + ncn_id + '" title="Ingest scenario '+ ncn_id +'" >' +
                                '<i class="fa fa-sign-in fa-rotate-90"></i></button>' +

                            // Add local product from file
                            '<button type="button" class="btn btn-default" ' +
                                'id="btn-add-product-' + ncn_id + '" title="Add local product to '+ ncn_id+'" >' +
                                '<i class="fa fa-file-o"></i></button>' +

                            // edit
                            '<button type="button" class="btn btn-default" ' +
                                'id="btn-edit-scenario-' + ncn_id + '" title="Edit scenario '+ ncn_id + '" >' +
                                '<i class="fa fa-edit"></i></button>' +

                            // delete
                            '<button type="button" class="btn btn-default" ' +
                                'id="btn-delete-scenario-' + ncn_id + '" title="Delete scenario '+ ncn_id+'" >' +
                                '<i class="fa fa-trash-o"></i></button>' +
                            '</td>' +

                            // id and name
                            '<td width=10% title="Scenario Id">' + ncn_id + '</td>' +
                            '<td colspan=2 title="Scenario Name">' + scenarios[i].scenario_name + '</td>' +
                            '</tr>' +
                            '<tr>' +
                            //                            '<td></td>' +

                            // description text accross all columns
                            '<td colspan=3 title="Description">' + scenarios[i].scenario_description + '</td>' +
                            '</tr>' +
                            '<tr>' +
                            // '<td></td>' +

                            // status
                            '<td><div id="div_status_' + ncn_id + '"/>' + scenarios[i].st_st + '</td>' +
                            
                            // stop button
                            '<td><button type="button" class="btn btn-default" ' +
                                'id="btn-stop-scenario-' + ncn_id + '" title="Stop scenario'+ ncn_id+'" >' +
                                 '<i class="fa fa-stop"></i></button>' +
                            '</td>' +
                            '<td>' +

                            // progress bar
                            '<div id="pro_container_' + ncn_id + '" ' +
                                'style="width:100%; height:10px; border:1px solid black; ' +
                                'vertical-align:middle; padding:0">' +
                            '<div id="progress_bar_' + ncn_id + '" ' +
                                'style="width:' + scenarios[i].st_done +'%; height:8px; border:none; background-color:#6666dd; ' +
                                'padding:0; vertical-align:sub"/>' +
                            '</div>' +

                            '</td>' +
                            '</tr>' +
                            '</table>' +
                            '<hr>';
                    }

                    that.$('#scenario-list').html(scenarioHTML);

                    for (var i=0; i<scenarios.length; i++)
                    {
                        var ncn_id = scenarios[i].ncn_id;
                        var sc_id  = scenarios[i].id;

                        that.$('#btn-ingest-scenario-' + ncn_id).on
                            ("click", _.bind(that.run_iet5_ajax, that, "ingestScenario", "Ingest", sc_id, ncn_id));
                        that.$('#btn-delete-scenario-' + ncn_id).on
                            ("click", _.bind(that.run_iet5_ajax, that, "deleteScenario", "Delete", sc_id, ncn_id));
                        that.$('#btn-stop-scenario-'   + ncn_id).on
                            ("click", _.bind(that.run_iet5_ajax, that, "stopScenario",    "Stop",  sc_id, ncn_id));
                        that.$('#btn-add-product-'     + ncn_id).on("click",  _.bind(that.onAddLocalProduct, that, sc_id, ncn_id));
                        that.$('#btn-edit-scenario-'   + ncn_id).on("click",  _.bind(that.onEditScenario,    that, ncn_id));

                    }

                },

                run_iet5_ajax : function (url_key, op, sc_id, ncn_id)
                {
                    var ss = this.get_scenario_st(this, sc_id, ncn_id);

                    if (! ss) {
                        alert('Internal error, \n' +
                              'please reload the Ingestion Admin Client');
                        return;
                    }

                    if (ss.st_isav==0) {
                        alert('Scenario '+ncn_id+'is locked - operation in progress');
                        return;
                    }

                    if(confirm(op + ' scenario '+ncn_id+'?')) {
                        var url = this.getIngEngUrl( url_key ) + ncn_id ;
                        var req = $.get(url);

                        this.change_pending = true;
                        req.success(_.bind(function(result) {
                                    var st = JSON.parse(result).status;
                                    console.log("IngAdmT5: Axax status: " + st);
                                    if (st === undefined || st != 0) {
                                        this.change_pending = false;
                                        console.log("IngAdmT5: "+ncn_id+" ajax :"+result);
                                    } else {
                                        console.log("IngAdmT5: "+ncn_id+" ajax " + op + " OK");
                                    }
                                }, this));

                        req.error(_.bind(function(jqXHR, textStatus, errorThrown) {
                                    this.change_pending = false;
                                    if (textStatus == 'timeout')
                                        console.log('IngAdmT5: The ingestion engine is not responding.');
                                        
                                    if (textStatus == 'error')
                                        console.log('IngAdmT5: '+ncn_id+' ajax ' +op+ ' ' + errorThrown);
                                }, this));

                        var idel;
                        idel = setInterval(_.bind(function() {
                                    if (this.change_pending) {
                                        this.model.fetch();
                                    } else {
                                        clearInterval(idel);
                                    }
                                }, this),
                            850);
                    }
                },

                initialize: function  (model) {
                    // bind the functions 'add' and 'remove' to the view.
                    //_(this).bindAll('add', 'remove');

                    this.model.on("change",  _.bind(this.onModelChange, this));
                 },

                onShow: function (view)
                {
                    this.is_showing = true;
                    this.listenTo(Communicator.mediator, 'time:change', this.onTimeChange);
                    this.listenTo(Communicator.mediator, "selection:changed", this.onSelectionChange);

                    this.$('.close').on("click", _.bind(this.onClose, this));

                    // this.$('#btn-iet5-test').on("click",  _.bind(this.onTest, this))
                    this.$('#btn-iet5-addscenario').on("click", _.bind(this.onAddScenario, this));
                    this.$('#btn-iet5-showlog').on("click",     _.bind(this.onShowLog,     this));

                    this.updater.i = setInterval(_.bind(function() {
                                this.model.fetch();
                            },
                            this ),
                       2250);

                    this.$el.draggable(
                    { 
                        containment: "#content" ,
                        scroll: true,
                        handle: '.panel-heading'
                    });

                    // display each scenario's buttons and status
                    this.set_scenarios_html(this);

                },

                getIngEngUrl : function(op) {
                    var ie_options = globals.objects.get('ingestionEngineT5');
                    return ie_options['baseUrl'] + ie_options[op];
                },
                
                openEditWindow: function(url) {
                    var w = window.open(url, "", "width=850,height=700,scrollbars=1,resizable=1");
                    var iedit;
                    iedit = setInterval(_.bind(function() {
                                if (this.k.closed) {
                                    this.m.fetch();
                                    clearInterval(iedit);
                                }
                            }, {k:w, m: this.model }),
                        800);
                },

                onAddLocalProduct: function (sc_id, ncn_id)
                {
                    /*
                    console.log("onAddLocalProduct" + sc_id);
       				globals.objects.add('curr_sc_id', sc_id);
                    console.log("curr_sc_id" + globals.objects.get('curr_sc_id'));
                    Communicator.mediator.trigger("dialog:open:add-local-product", true);
                    */
                    var url = this.getIngEngUrl( "addLocalProduct" );
                    var w = window.open(url+ncn_id, "Add Local Product" , "width=625,height=225,resizable=1");
                },

                onEditScenario: function(ncn_id)
                {
                    var edit_url = this.getIngEngUrl( "editScenario" );
                    this.openEditWindow(edit_url+ncn_id);
                },

                onAddScenario: function()
                {
                    var add_url = this.getIngEngUrl( 'addScenario' );
                    this.openEditWindow(add_url);
                },

                onShowLog: function()
                {
                    var add_url = this.getIngEngUrl( 'showLog' );
                    var w = window.open(add_url, "Ingestion Admin Log", "width=850,height=650,scrollbars=1,resizable=1");
                },

                onTimeChange: function (time)
                {
                    this.$('#div-date-begin input[type="text"]').datepicker('update', this.model.get('ToI').start);
                    this.$('#div-date-end input[type="text"]').datepicker('update', this.model.get('ToI').end);
                },

                onChangeDate: function (evt)
                {
                    var opt = 
                    {
                        start: this.$('#div-date-begin input[type="text"]').datepicker('getDate'),
                        end: this.$('#div-date-end input[type="text"]').datepicker('getDate')
                    };
                    Communicator.mediator.trigger('date:selection:change', opt);
                },

                onSelectionChange: function (obj) 
                {
                    /*
                    if (obj)
                    {
                        $("#txt-minx").val(obj.bounds.left);
                        $("#txt-maxx").val(obj.bounds.right);
                        $("#txt-miny").val(obj.bounds.bottom);
                        $("#txt-maxy").val(obj.bounds.top);
                    }
                    */
                },

                onBBoxChange: function (event) 
                {

                    var values =

                    {
                        /*
                        left: parseFloat($("#txt-minx").val()),
                        right: parseFloat($("#txt-maxx").val()),
                        bottom: parseFloat($("#txt-miny").val()),
                        top: parseFloat($("#txt-maxy").val())
                        */
                    };

                    /*
                    if(!isNaN(values.left) && !isNaN(values.right) &&
                        !isNaN(values.bottom) && !isNaN(values.top) )
                    {
                        
                        if ( !(values.left > values.right || values.bottom > values.top))
                        {
                            Communicator.mediator.trigger('selection:bbox:changed',values);
                        }
                    }
                    */
                },

                onModelChange: function()
                {
                    console.log("View knows that model has changed.");
                    this.change_pending = false;
                    this.set_scenarios_html(this);
                },

                onTest: function() 
                {
                    this.model.fetch();

                    this.updater.i = setInterval(_.bind(function() {
                                this.model.fetch();
                            },
                            this ),
                        1250);

                    /*
                    $('#btn-iet5-test').off("click");
                    $('#btn-iet5-test').on("click",  function(){
                            console.log(" yyyyyy closing ");
                            w.close();
                        });
                    var zz;
                    zz = setInterval(_.bind(function() {
                                console.log(this['k'].closed);
                                if (this['k'].closed) {
                                    clearInterval(zz);
                                }
                            },
                            {k:w}),
                        750);
                    */

                },

                onClose: function() 
                {
                    this.is_showing = false;
                    clearInterval(this.updater.i);
                    this.close();
                }
                
            }); /* end of IngestionAdminT5View = Backbone.Marionette.CompositeView.extend() */

            return {'IngestionAdminT5View':IngestionAdminT5View};

        } /* end of function() */

    ); /* end of root.define() */

}).call( this );
