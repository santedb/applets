/*
 * Copyright 2015-2019 Mohawk College of Applied Arts and Technology
 * 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you 
 * may not use this file except in compliance with the License. You may 
 * obtain a copy of the License at 
 * 
 * http://www.apache.org/licenses/LICENSE-2.0 
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the 
 * License for the specific language governing permissions and limitations under 
 * the License.
 * 
 * User: Justin Fyfe
 * Date: 2019-8-8
 */

/// <reference path="./santedb-ui.js"/>
/// <reference path="../../core/js/santedb.js"/>

angular.module('santedb-lib')
    /**
     * @method entitySearch
     * @memberof Angular
     * @summary Binds a select2 search box to the specified select input searching for the specified entities
     * @description This class is the basis for all drop-down searches in disconnected client. It is used whenever you would like to have a search inline in a form and displayed nicely
     * @param {string} value The type of object to be searched
     * @param {string} filter The additional criteria by which results should be filtered
     * @param {string} data-searchField The field which should be searched on. The default is name.component.value
     * @param {string} data-default The function which returns a list of objects which represent the default values in the search
     * @param {string} data-groupBy The property which sets the grouping for the results in the drop-down display
     * @param {string} data-groupDisplay The property on the group property which is to be displayed
     * @param {string} data-resultField The field on the result objects which contains the result
     * @example
     * <entity-search type="'Place'" 
                    class="form-control" 
                    name="subscribeFacility" 
                    ng-model="config.subscription.facility" 
                    filter='{ "statusConcept.mnemonic" : "ACTIVE" }'/>
     */
    .directive('entitySearch', function ($timeout) {

        var renderObject = function (selection) {

            if (selection.text)
                return selection.text;

            var retVal = "";
            switch (selection.$type) {
                case "UserEntity":
                case "Provider":
                case "Patient":
                    retVal += "<i class='fa fa-user'></i> ";
                    break;
                case "Material":
                case "ManufacturedMaterial":
                    retVal += "<i class='fa fa-flask'></i> ";
                    break;
                case "Place":
                    retVal += "<i class='fa fa-map-pin'></i> ";
                    break;
                case "Organization":
                    retVal += "<i class='fa fa-building'></i> ";
                    break;
                case "Entity":
                    retVal += "<i class='fa fa-share-alt'></i> ";
                    break;
                case "AssigningAuthority":
                    retVal += "<i class='fa fa-id-card'></i> ";
                    break;
                case "SecurityRole":
                case "SecurityRoleInfo":
                case "SanteDB.Core.Model.AMI.Auth.SecurityRoleInfo, SanteDB.Core.Model.AMI":
                    retVal += "<i class='fa fa-users'></i>";
                    break;
                case "SecurityUser":
                case "SecurityUserInfo":
                case "SanteDB.Core.Model.AMI.Auth.SecurityUserInfo, SanteDB.Core.Model.AMI":
                    retVal += "<i class='fa fa-user'></i>";
                    break;
                case "Concept":
                    retVal += "<i class='fa fa-book-medical'></i>";
                    break;
                case "SecurityPolicy":
                case "SecurityPolicyInstance":
                    retVal += "<i class='fa fa-certificate'></i>";
                    break;
                default:
                    retVal += "<i class='fa fa-box'></i> ";
                    break;
            }
            retVal += "&nbsp;";

            if (selection.typeConceptModel) {
                retVal += `<span class="badge badge-info">${SanteDB.display.renderConcept(selection.typeConceptModel)}</span> `;
            }

            if (selection.name != null && selection.name.OfficialRecord != null)
                retVal += SanteDB.display.renderEntityName(selection.name.OfficialRecord);
            else if (selection.name != null && selection.name.Assigned != null)
                retVal += SanteDB.display.renderEntityName(selection.name.Assigned);
            else if (selection.name != null && selection.name.$other != null)
                retVal += SanteDB.display.renderEntityName(selection.name.$other);
            else if(selection.name != null && selection.name[SanteDB.locale.getLocale()])
                retVal += selection.name[SanteDB.locale.getLocale()];
            else if (selection.name != null)
                retVal += selection.name;
            else if (selection.userName)
                retVal += selection.userName;
            else if (selection.entity)
                retVal += (selection.entity.name || selection.entity.userName);
            else if (selection.element !== undefined)
                retVal += selection.element.innerText.trim();
            else if (selection.text)
                retVal += selection.text;
            if (selection.address)
                retVal += " - <small>(<i class='fa fa-map-marker'></i> " + SanteDB.display.renderEntityAddress(selection.address) + ")</small>";
            else if (selection.oid)
                retVal += " - <small>(<i class='fa fa-cogs'></i> " + selection.oid + ")</small>";

            if(selection.classConceptModel)
                retVal += ` <span class='badge badge-info'>${SanteDB.display.renderConcept(selection.classConceptModel)}</span>`;
            return retVal;
        }

        return {
            scope: {
                defaultResults: '=',
                type: '<',
                display: '<',
                searchField: '<',
                defaultResults: '<',
                groupBy: '<',
                filter: '<',
                groupDisplay: '<',
                key: '<',
                selector: '<',
                valueProperty: '<'
            },
            restrict: 'E',
            require: 'ngModel',
            replace: true,
            transclude: true,
            templateUrl: './org.santedb.uicore/directives/entitySearch.html',
            controller: ['$scope', '$rootScope',
                function ($scope, $rootScope) {

                    $scope.setValue = (selectControl, resource, value) => {
                        if (!value || Array.isArray(value) && value.length == 0) {
                            $(selectControl).find('option').remove();
                            $(selectControl).trigger('change.select2');
                        }
                        else {
                            var api = SanteDB.resources[resource.toCamelCase()];

                            if (!Array.isArray(value))
                                value = [value];

                            $(selectControl).find('option[value="? undefined:undefined ?"]').remove();
                            $(selectControl).find("option[value='loading']").remove();
                            $(selectControl)[0].add(new Option(`<i class='fa fa-circle-notch fa-spin'></i> ${SanteDB.locale.getString("ui.wait")}`, "loading", true, true));

                            value.forEach(function (v) {

                                // Key selector is ID
                                if ($scope.key && $scope.key != "id") {
                                    var query = {};
                                    query[$scope.key] = v;
                                    query._viewModel = "dropdown";
                                    api.findAsync(query)
                                        .then(function (res) {
                                            $(selectControl).find("option[value='loading']").remove();

                                            // Matching item
                                            if (res.item.length == 1)
                                                if ($(selectControl).find(`option[value=${v}]`).length == 0) {
                                                    var obj = res.item[0];
                                                    if ($scope.selector)
                                                        obj = obj[$scope.selector] || obj;
                                                    $(selectControl)[0].add(new Option(renderObject(res.item[0]), v, false, true));
                                                    $(selectControl).trigger('change.select2');
                                                }

                                        });
                                }
                                else // Lookup by ID
                                    api.getAsync({ id: v, viewModel: "dropdown" })
                                        .then(function (res) {
                                            $(selectControl).find("option[value='loading']").remove();

                                            if ($(selectControl).find(`option[value=${v}]`).length == 0) {
                                                var obj = res;
                                                if ($scope.selector)
                                                    obj = obj[$scope.selector] || obj;
                                                $(selectControl)[0].add(new Option(renderObject(obj), v, false, true));
                                                $(selectControl).trigger('change.select2');
                                            }
                                        });
                            });
                        }
                    }
                }
            ],
            link: function (scope, element, attrs, ngModel) {
                $timeout(function () {
                    var modelType = scope.type;
                    var filter = scope.filter || {};
                    var displayString = scope.display;
                    var searchProperty = scope.searchField || "name.component.value";
                    var defaultResults = scope.defaultResults;
                    var groupString = scope.groupBy;
                    var groupDisplayString = scope.groupDisplay;
                    var resultProperty = scope.key || "id";
                    var selector = scope.selector;
                    var valueProperty = scope.valueProperty;

                    $(element).find('option[value="? undefined:undefined ?"]').remove();
                    
                    // Bind select 2 search
                    $(element).select2({
                        language: {
                            searching: function () { return `<i class="fa fa-circle-notch fa-spin"></i> ${SanteDB.locale.getString("ui.search")}`; }
                        },
                        defaultResults: function () {
                            var s = scope;
                            if (defaultResults) {
                                try {
                                    return scope.$eval(defaultResults);
                                } catch (e) {

                                }
                            }
                            else {
                                return $.map($('option', element[0]), function (o) {
                                    return { "id": o.value, "text": o.innerText };
                                });
                            }
                        },
                        dataAdapter: $.fn.select2.amd.require('select2/data/extended-ajax'),
                        ajax: {
                            url: SanteDB.resources[modelType.toCamelCase()].getUrl(), //((modelType == "SecurityUser" || modelType == "SecurityRole" || modelType == "SecurityPolicy") ? "/ami/" : "/hdsi/") + modelType,
                            dataType: 'json',
                            delay: 500,
                            method: "GET",
                            headers: {
                                "Accept": "application/json+sdb-viewmodel"
                            },
                            data: function (params) {
                                filter[searchProperty] = "~" + params.term;
                                filter["_count"] = 20;
                                filter["_offset"] = 0;
                                filter["_viewModel"] = "dropdown";
                                return filter;
                            },
                            processResults: function (data, params) {
                                //params.page = params.page || 0;
                                var data = data.$type == "Bundle" ? data.item : data.item || data;
                                var retVal = { results: [] };

                                if (groupString == null && data !== undefined) {
                                    retVal.results = retVal.results.concat($.map(data, function (o) {

                                        if (selector && o[selector])
                                            o = o[selector];

                                        var text = "";
                                        if (displayString) {
                                            text = scope.$eval(displayString, { scope: o });
                                        }
                                        else if (o.name !== undefined) {
                                            text = renderObject(o);
                                        }
                                        o.text = o.text || text;
                                        o.id = o[resultProperty] || o.id;
                                        return o;
                                    }));
                                }
                                else {
                                    // Get the group string
                                    for (var itm in data) {
                                        // parent obj
                                        try {
                                            var groupDisplay = scope.$eval('scope.' + groupString, { scope: data[itm] });

                                            var gidx = $.grep(retVal.results, function (e) { return e.text == groupDisplay });
                                            if (gidx.length == 0)
                                                retVal.results.push({ "text": groupDisplay, "children": [data[itm]] });
                                            else
                                                gidx[0].children.push(data[itm]);
                                        }
                                        catch (e) {
                                            retVal.results.push(data[itm]);
                                        }
                                    }
                                }
                                return retVal;
                            },
                            cache: true
                        },
                        escapeMarkup: function (markup) { return markup; }, // Format normally
                        minimumInputLength: 2,
                        templateSelection: renderObject,
                        keepSearchResults: true,
                        templateResult: renderObject
                    });

                    // On change
                    element.on('change', function (e) {
                        var val = $(element).select2("val");
                        //e.currentTarget.options.selectedIndex = e.currentTarget.options.length - 1;
                        if (valueProperty) {
                            var modelVal = {};
                            if (Array.isArray(val))
                                modelVal = val.map(function (v) {
                                    var retVal = {};
                                    retVal[valueProperty] = v;
                                    return retVal;
                                });

                            else
                                modelVal[valueProperty] = val;
                            scope.$apply(() => ngModel.$setViewValue(modelVal));

                        }
                        else
                            scope.$apply(() => ngModel.$setViewValue(val));
                    });
                    ngModel.$render = function () {
                        if (valueProperty) {
                            if (Array.isArray(ngModel.$viewValue))
                                scope.setValue(element, modelType, ngModel.$viewValue.map(function (e) { return e[valueProperty]; }));
                            else
                                scope.setValue(element, modelType, ngModel.$viewValue[valueProperty]);
                        }
                        else
                            scope.setValue(element, modelType, ngModel.$viewValue);
                    };

                    // HACK: Screw Select2 , it is so random
                    if(ngModel.$viewValue)
                        scope.setValue(element, modelType, ngModel.$viewValue);

                });
            }
        };
    })
    /**
     * @summary Blocks a button whenever the current principal does not have permission
     */
    .directive("demand", ['$rootScope', function ($rootScope) {
        return {
            restrict: 'A',
            replace: true,
            link: function (scope, element, attrs) {
                // Ensure ID Data exists
                if (!$rootScope.session.id_data)
                    $rootScope.session.id_data = JSON.parse(atob($rootScope.session.id_token));
                if ($rootScope.session.id_data.scope.indexOf(attrs.sdbDemand) == -1) {
                    element.addClass("disabled");
                    element.attr("disabled", "disabled");
                }
            }
        }
    }])
    /**
     * @summary Directive for rendering a table of entities
     */
    .directive('entityTable', ['$timeout', '$compile', '$rootScope', '$state', function ($timeout, $compile, $rootScope, $state) {
        
        return {
            scope: {
                properties: "<",
                external: "<",
                defaultQuery: "=",
                itemActions: "<",
                actions: "<",
                render: "<",
                i18nPrefix: "<",
                multiSelect: "<",
                sort: "<",
                defaultFilter: "<",
                canFilter: "<",
                canSize: "<",
                noButtons: "<",
                buttonBar: "<"
            },
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: './org.santedb.uicore/directives/entityTable.html',
            controller: ['$scope', '$rootScope',
                function ($scope, $rootScope) {
                }
            ],
            link: function (scope, element, attrs, ngModel) {

                var lastQuery = "";
                var queryId = null;
                var isSearching = false; // true if a search is being performed
                var returnTimer = null;

                $timeout(function () {

                    scope.propertyPath = attrs.propertyPath;

                    var columns = scope.properties.map(function (m) {
                        var renderer = scope.render ? scope.render[m] : null;

                        return {
                            orderable: renderer == null || scope.sort && scope.sort[m] !== undefined,
                            data: m,
                            defaultContent: '',
                            render: renderer ?
                                function (d, t, r) { 
                                    if(typeof(renderer) == "function")
                                        return renderer(r);
                                    else if(typeof(scope.$parent[renderer]) === "function")
                                        return scope.$parent[renderer](r);
                                    else 
                                        return `<span class='alert alert-danger'><i class='fas fa-bug'></i> ${renderer} not a function</span>`;
                                 } :
                                m.indexOf("Time") > -1 ?
                                    function (d, t, r) {
                                        return d ? moment(d).format(SanteDB.locale.dateFormats.second) :
                                            null;
                                    } : null
                        };
                    });

                    // Add ID
                    columns.unshift({ data: "id", visible: false });

                    // Add buttons 
                    if (scope.itemActions && scope.itemActions.length > 0) {
                        columns.push({
                            orderable: false,
                            render: function (d, t, r, m) {
                                var retVal = `<div class='btn-group' id='action_grp_${m.row}'>`;
                                scope.itemActions.forEach(function (b) {

                                    if (!b.when || scope.$eval(b.when, { r: r , StatusKeys: StatusKeys})) {
                                        if (b.sref)
                                            retVal += `<a title="${SanteDB.locale.getString('ui.action.' + b.name)}" ui-sref="${b.sref}({ id: '${r.id}' })" class="btn ${(b.className || 'btn-default')}">`;
                                        else
                                            retVal += `<a title="${SanteDB.locale.getString('ui.action.' + b.name)}" href="" ng-click="$parent.${b.action}('${r.id}', ${m.row})" class="btn ${(b.className || 'btn-default')}">`;
                                        retVal += `<i class="${b.icon || 'fas fas-eye-open'}"></i>&nbsp;`;

                                        if (b.name)
                                            retVal += `<span class="d-sm-none d-lg-inline">${SanteDB.locale.getString(b.label || 'ui.action.' + b.name)}</span>`;
                                        retVal += "</a>";
                                    }
                                });
                                return retVal + "</div>";
                            }
                        })
                    }

                    // Buttons
                    var buttons = [];
                    
                    if(scope.buttonBar) 
                        buttons = [ 'copy' ];
                    else if(scope.noButtons)
                        buttons = [];
                    else {
                        buttons = (scope.actions || []).map(function (b) {
                            return {
                                text: `<i class="${b.icon}"></i> ` + SanteDB.locale.getString('ui.action.' + b.name),
                                className: `btn ${b.className || 'btn-default'}`,
                                action: function (e, dt, node, config) {
                                    $state.transitionTo(b.sref);
                                }
                            }
                        });

                        // Add refresh button
                        buttons.push(
                        'reload'
                        );

                        // Add a show obsolete button
                        if(scope.defaultQuery && scope.defaultQuery.obsoletionTime)
                            buttons.push({
                                text: "<i class='fas fa-trash'></i> " + SanteDB.locale.getString("ui.action.showDeleted"),
                                className: "btn btn-light",
                                action: function (e, dt, node, config) {
                                    
                                    var btn = $("button.btn-light:has(i.fa-trash)", element);
                                    if(btn.hasClass("active")) { // active to inactive
                                        scope.defaultQuery.obsoletionTime = 'null';
                                        $("button.btn-light:has(i.fa-trash)", element).removeClass("active");
                                    }
                                    else {
                                        scope.defaultQuery.obsoletionTime = '!null';
                                        $("button.btn-light:has(i.fa-trash)", element).addClass("active");
                                    }
                                    
                                    dt.ajax.reload();
                                    
                                }
                            });
                        else if(scope.defaultQuery && scope.defaultQuery.statusConcept)
                            buttons.push({
                                text: "<i class='fas fa-trash'></i> " + SanteDB.locale.getString("ui.action.showDeleted"),
                                className: "btn btn-light",
                                action: function (e, dt, node, config) {
                                    if (!scope.defaultQuery.statusConcept || scope.defaultQuery.statusConcept == StatusKeys.Active) {
                                        scope.defaultQuery.statusConcept = '!' + StatusKeys.Active;
                                        $("button.btn-light:has(i.fa-trash)", element).addClass("active");
                                    }
                                    else {
                                        scope.defaultQuery.statusConcept = StatusKeys.Active;
                                        $("button.btn-light:has(i.fa-trash)", element).removeClass("active");
                                    }
                                    dt.ajax.reload();
                                }
                            });
                    }
                    
                    // Default is true
                    if(scope.canFilter === undefined)
                        scope.canFilter = true;
                    
                    var dt = $("table", element).DataTable({
                        lengthChange: scope.canSize,
                        processing: true,
                        buttons: buttons,
                        serverSide: true,
                        searching: scope.canFilter,
                        "oSearch": scope.defaultFilter ? {"sSearch": scope.defaultFilter} : undefined,
                        ajax: function (data, callback, settings) {

                            
                            var query = angular.copy(scope.defaultQuery) || {};
                            if(data.search.value) {
                                if (data.search.value.length > 0)
                                    query[attrs.searchField] = `~${data.search.value}`;
                            }
                            if (data.order[0].column != 0) {
                                var orderExpr = colname = scope.properties[data.order[0].column - 1]; // -1 because the ID column is hidden
                                if(scope.sort && scope.sort[colname])
                                    orderExpr = scope.sort[colname];

                                query["_orderBy"] = `${orderExpr}:${data.order[0].dir}`;
                            }
                            if (scope.extenral)
                                query["_upstream"] = true;

                            var thisQuery = JSON.stringify(query);
                            if (lastQuery != thisQuery || element.attr("newQuery") == "true") {
                                lastQuery = thisQuery;
                                queryId = SanteDB.application.newGuid();
                                element.attr("newQuery", false);
                            }

                            query["_queryId"] = queryId;
                            query["_count"] = data.length;
                            query["_offset"] = data.start;

                            if(!query._noexec) {
                                
                                // Set a timeout for 1s and then re-check 
                                if(isSearching)
                                {
                                    if(!returnTimer)
                                        returnTimer = setTimeout(() => dt.ajax.reload(), 1000);
                                }
                                else {
                                    if(returnTimer) clearTimeout(returnTimer); // cancel the previous timer
                                    isSearching = true;
                                    SanteDB.resources[attrs.type.toCamelCase()].findAsync(query)
                                        .then(function (res) {

                                            res.item = res.item || [];
                                            callback({
                                                data: res.item.map(function (item) {
                                                    if (scope.propertyPath)
                                                        return item[scope.propertyPath];
                                                    else
                                                        return item;
                                                }),
                                                recordsTotal: res.totalResults || res.size || 0,
                                                recordsFiltered: res.totalResults || res.size || 0,
                                                iTotalRecords: res.totalResults || res.size || 0,
                                                iTotalDisplayRecords: res.totalResults  || res.size  || 0
                                            });
                                            isSearching = false;
                                        })
                                        .catch(function (err) { 
                                            isSearching = false;
                                            $rootScope.errorHandler(err);
                                        });
                                }
                            }
                            else {
                                callback({ 
                                    data: [],
                                    recordsTotal: 0,
                                    recordsFiltered: 0,
                                    iTotalRecords: 0,
                                    iTotalDisplayRecords: 0
                                });
                            }
                        },
                        createdRow: function (r, d, i) {
                            $compile(angular.element(r).contents())(scope);
                            scope.$digest()
                        },
                        columns: columns
                    });

                    var bindButtons = function (element, buttonBar) {
                        dt.buttons().container().appendTo($('.dataTables_wrapper .col-md-6:eq(0)', element));
                        if (dt.buttons().container().length == 0) {
                            $timeout(() => bindButtons(element, buttonBar), 1000);
                        } else if(buttonBar) {
                            $(buttonBar).appendTo($('.col-md-6:eq(0)', dt.table().container()));
                        }
                    };

                    // Add watch to scope query
                    scope.$watch((s)=>JSON.stringify(s.defaultQuery), function(n,o) { if(n && n != o) dt.ajax.reload() });
                    bindButtons(element, scope.buttonBar);
                });
            }
        };
    }])
    /**
     * @method breadcrumbs
     * @memberof Angular
     * @summary Represents a directive which gathers breadcrumbs
     */
    .directive("breadcrumbs", ['breadcrumbService', function (breadcrumbService) {
        return {
            restrict: 'E',
            replace: true,
            priority: 100,
            templateUrl: './org.santedb.uicore/directives/breadcrumb.html',
            link: {
                pre: function (scope, element, attrs) {
                    breadcrumbService.generate();
                    scope.breadcrumbs = breadcrumbService.list;
                    breadcrumbService.change = () => scope.breadcrumbs = breadcrumbService.list;
                }
            }
            // controller: ['$scope', 'BreadcrumbService', function ($scope, BreadcrumbService) { BreadcrumbService.generate(); $scope.breadcrumbList = BreadcrumbService.list; }]
        };
    }])
    /**
     * @method inputCopyButton
     * @memberof Angular
     * @summary Creates an input button with an easy copy button
     * @param {string} source The source copy
     */
    .directive("inputCopyButton", function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/inputCopy.html',
            scope: {
                source: '='
            },
            controller: ["$scope", function ($scope) {
                $scope.copyInput = function () {
                    if (navigator.clipboard)
                        navigator.clipboard.writeText($scope.source);

                }
            }]
        }
    })
    /**
     * @method tagInput
     * @memberof Angular
     * @summary Creates a tagged input
     */
    .directive("tagInput", function () {
        return {
            require: 'ngModel',
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/tagInput.html',
            scope: {

            },
            link: function (scope, element, attrs, ngModel) {

                // Parsers
                ngModel.$parsers.unshift(function (viewValue) {
                    if (Array.isArray(viewValue))
                        return viewValue.join(",")
                    return viewValue.split(",");
                });
                ngModel.$formatters.unshift(function (viewValue) {
                    if (viewValue)
                        return String(viewValue).split(',');
                });

                // Token field initialization
                $(element).tokenfield({
                    createTokensOnBlur: true,
                    delimiter: [',', ' ']
                });

                ngModel.$render = function () {
                    var viewValue = ngModel.$viewValue;
                    if (Array.isArray(viewValue))
                        $(element).tokenfield('setTokens', viewValue);
                    else if (viewValue)
                        $(element).tokenfield('setTokens', viewValue.split(','));
                    //$(element).trigger('change');
                };
            }
        }
    })
    /**
     * @method provenance
     * @memberof Angular
     * @summary Renders a provenance info box
     */
    .directive("provenance", ['$timeout', function ($timeout) {

        var alreadyFetching = [];
        var uiqueId = 0;
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/provenance.html',
            scope: {
                provenanceId: '<',
                provenanceTime: '<',
                sessionfn: "<"
            },
            link: function (scope, element, attrs) {


                if (alreadyFetching.indexOf(scope.provenanceId) == -1) // Not yet fetching
                {
                    scope.isLoading = true;
                    alreadyFetching.push(scope.provenanceId);

                    // Fetch provenance
                    SanteDB.resources.securityProvenance.getAsync(scope.provenanceId)
                        .then(function (provData) {
                            alreadyFetching.splice(alreadyFetching.indexOf(provData.id), 1);
                            scope.isLoading = false;
                            scope.provData = provData;

                            // Construct a popover of extra info
                            var extraInfo = "";
                            if(provData.userModel != null)
                                extraInfo += `<br/><b><i class='fas fa-user'></i> ${SanteDB.locale.getString('ui.provenance.user')}:</b> ${provData.userModel.userName}`;
                            if (provData.applicationModel != null)
                                extraInfo += `<br/><b><i class='fas fa-window-maximize'></i> ${SanteDB.locale.getString('ui.provenance.application')}:</b> ${provData.applicationModel.name}`;
                            if (scope.provenanceTime)
                                extraInfo += `<br/><b><i class='fas fa-clock'></i> ${SanteDB.locale.getString('ui.provenance.timestamp')}:</b>  ${moment(scope.provenanceTime).format(SanteDB.locale.dateFormats.second)}`;
                            if (provData.session)
                                extraInfo += `<br/><b><i class='fas fa-asterisk'></i>  ${SanteDB.locale.getString('ui.provenance.session')}:</b> ${provData.session.substring(0, 8)}`;
                            extraInfo = extraInfo.substring(5);

                            scope.$apply();
                            $timeout(function () {
                                $('button:first', element).attr('data-content', extraInfo);
                                $('button:first', element).popover({ html: true });
                            });

                            // Set the scope of all elements
                            $(`div.prv_${scope.provenanceId}`).each(function (i, e) {
                                if (e == $(element)[0]) return;
                                $(e).removeClass(`prv_${scope.provenanceId}`);

                                var sscope = angular.element(e).isolateScope();
                                sscope.provData = provData;
                                sscope.isLoading = false;
                                sscope.$apply();
                                $timeout(function () {
                                    $('button:first', e).attr('data-content', extraInfo);
                                    $('button:first', e).popover({ html: true });
                                });

                            });


                        }).catch(function (e) {
                            alreadyFetching.splice(alreadyFetching.indexOf(scope.provenanceId), 1);
                            scope.isLoading = false;
                            var provData = scope.provData = { "userModel": { "userName": "$R" }};
                            scope.error = true;

                            var extraInfo = "";
                            if(provData.userModel != null)
                                extraInfo += `<b><i class='fas fa-user'></i> ${SanteDB.locale.getString('ui.provenance.user')}:</b> ${provData.userModel.userName}`;
                            if (scope.provenanceTime)
                                extraInfo += `<br/><b><i class='fas fa-clock'></i> ${SanteDB.locale.getString('ui.provenance.timestamp')}:</b>  ${moment(scope.provenanceTime).format(SanteDB.locale.dateFormats.second)}`;

                            try {
                                scope.$apply();
                                $timeout(function () {
                                    $('button:first', element).attr('data-content', extraInfo);
                                    $('button:first', element).popover({ html: true });
                                });

                                // Set the scope of all elements
                                $(`div.prv_${scope.provenanceId}`).each(function (i, e) {
                                    if (e == $(element)[0]) return;
                                    $(e).removeClass(`prv_${scope.provenanceId}`);

                                    var sscope = angular.element(e).isolateScope();
                                    sscope.provData = provData;
                                    sscope.isLoading = false;
                                    sscope.$apply();
                                    $timeout(function () {
                                        $('button:first', e).attr('data-content', extraInfo);
                                        $('button:first', e).popover({ html: true });
                                    });

                                });
                            }
                            catch (e) {}
                        })
                }
                else {
                    scope.isLoading = true;
                    $(element).addClass(`prv_${scope.provenanceId}`);
                }
            }
        }
    }])
    /**
     * @summary Shows history of entity edits
     * @memberof Angular
     * @method entityHistory
     */
    .directive('entityHistory', function() {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/entityHistory.html',
            scope: {
                target: '='
            },
            controller: ['$scope', '$rootScope', function($scope, $rootScope) {

                var ignoreProperties = [ "$id", "$ref", "etag", "createdBy", "creationTime", "obsoletedBy", "obsoletionTime", "creationTimeModel", "obsoletionTimeModel", "version", "sequence", "previousVersion" ];

                var previousVersionStack = [];

                // Diff two objects 
                $scope.diff = function(oldVersion, newVersion) {
                    var retVal = [];
                    for(var k in Object.keys(oldVersion)) {
                        var kName = Object.keys(oldVersion)[k];
                        if(ignoreProperties.indexOf(kName) == -1 && newVersion[kName] != oldVersion[kName])
                            retVal.push(kName);
                    }
                    return retVal;
                }

                // Push history information to the result array
                $scope.pushHistory = function(typeName, id, version) {
                    var tName = typeName.toCamelCase();
                    $scope.isLoading = true;
                    SanteDB.resources[tName].getAsync({
                        id: id,
                        version: version
                    }, "min")
                        .then(function(d) {
                            $scope.history.push(d);
                            var prev = $scope.history[$scope.history.length - 2];
                            prev.diff = $scope.diff(prev, d);
                            if(d.previousVersion && previousVersionStack.indexOf(d.previousVersion) == -1) {
                                previousVersionStack.push(d.previousVersion);
                                $scope.pushHistory(typeName, id, d.previousVersion);
                            }
                            else {
                                $scope.isLoading = true;
                                $scope.$apply();
                            }
                        })
                        .catch(function(e) {
                            $scope.isLoading = false;
                            $rootScope.errorHandler(e);
                        });
                }

                // Watch target for changes
                $scope.$watch(function(s) { return s.target; }, function(n, o) {
                    // Get the element type changed
                    if(n && (!o || o.id != n.id || !$scope.history)) {
                        $scope.history = [];
                        $scope.history.push($scope.target);
                        if(n.previousVersion)
                            $scope.pushHistory(n.$type, n.id, n.previousVersion);
                    }
                });
            }],
            link: function(scope, element, attrs) {
                scope.isLoading = false;

            }
        }
    })
    /**
     * @summary Security policy instance editor
     * @memberof Angular
     * @method entityPolicyAdmin
     */
    .directive('entityPolicyAdmin', ['$timeout', '$compile', '$rootScope', function ($timeout, $compile, $rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/policyAdmin.html',
            scope: {
                securable: '=',
                policy: '='
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

                $scope.deletePolicy = function (oid, index) {
                    if (confirm(SanteDB.locale.getString("ui.confirm.delete"))) {
                        SanteDB.display.buttonWait("#delPolicy" + index, true);

                        SanteDB.resources.securityPolicy.findAsync({ oid: oid, _count: 1})
                            .then(function(pol) {
                                var resource = SanteDB.resources[$scope.securable.$type.toCamelCase()];
                                if (resource == null)
                                    return;
                                resource.removeAssociatedAsync($scope.securable.id, "policy", pol.item[0].id)
                                    .then(function (d) {
                                        SanteDB.display.buttonWait("#delPolicy" + index, false);
                                        $scope.refresh();
                                    })
                                    .catch(function (e) {
                                        SanteDB.display.buttonWait("#delPolicy" + index, false);
                                        $rootScope.errorHandler(e);
                                    });
                            })
                            .catch(function (e) {
                                SanteDB.display.buttonWait("#delPolicy" + index, false);
                                $rootScope.errorHandler(e);
                            });
                        
                    }
                }

                // Mark grant as dirty
                $scope.updateGrant = function (oid, grant, index) {

                    SanteDB.display.buttonWait("#grant" + index, true);
                    SanteDB.resources.securityPolicy.findAsync({ oid: oid, _count: 1 })
                        .then(function (res) {
                            pol = res.item[0];
                            pol.grant = grant;
                            pol.$type = 'SecurityPolicyInfo';

                            var resource = SanteDB.resources[$scope.securable.$type.toCamelCase()];
                            if (resource == null)
                                return;
                            resource.addAssociatedAsync($scope.securable.id, "policy", pol)
                                .then(function (d) {
                                    SanteDB.display.buttonWait("#grant" + index, false);
                                    $scope.refresh();
                                })
                                .catch(function (e) {
                                    SanteDB.display.buttonWait("#grant" + index, false);
                                    $rootScope.errorHandler(e);
                                });
                        }).catch(function (e) {
                            SanteDB.display.buttonWait("#grant" + index, false);
                            $rootScope.errorHandler(e);
                        });

                }

                // Add a a new policy to the group
                $scope.addPolicy = function () {

                    $scope.newPolicy.exec = 'adding';
                    SanteDB.resources.securityPolicy.getAsync($scope.newPolicy.id)
                        .then(function (pol) {
                            pol.$type = 'SecurityPolicyInfo';
                            pol.grant = 'Grant';
                            var resource = SanteDB.resources[$scope.securable.$type.toCamelCase()];
                            if (resource == null)
                                return;
                            resource.addAssociatedAsync($scope.securable.id, "policy", pol)
                                .then(function (d) {
                                    delete ($scope.newPolicy);
                                    $scope.$apply();
                                    $scope.refresh();
                                })
                                .catch(function (e) {
                                    delete ($scope.newPolicy);
                                    $scope.$apply();
                                    $rootScope.errorHandler(e);
                                });
                        })
                        .catch(function (e) {
                            delete ($scope.newPolicy);
                            $scope.$apply();
                            $rootScope.errorHandler(e);
                        });
                }
            }],
            link: function (scope, element, attrs) {


                var dt = $('table', element).DataTable({
                    bLengthChange: false,
                    searching: true,
                    serverSide: true,
                    columnDefs: [
                        {
                            orderable: false,
                            targets: [0, 1, 2]
                        }
                    ],
                    buttons: [
                        'copy'
                    ],
                    columns: [
                        {
                            className: "indicator-container",
                            orderable: false,
                            render: function(d,t,r) {
                                return `<i class="fas fa-shield-alt" title="${ SanteDB.locale.getString(r.canOverride ? 'ui.model.securityPolicy.canOverride.true' : 'ui.model.securityPolicy.canOverride.false') }"></i>
                                <span class="indicator ${ r.canOverride ? 'text-warning' : 'text-success'}"><i class="fa fa-fw fa-circle"></i></span> 
                                ${r.name} <small>${r.oid}</small>`
                            }
                        },
                        {
                            orderable: false,
                            render: function(d, t, r, i) {
                                return `<div class="btn-group btn-group-toggle" id="grant${i.row}"><label class="btn btn-info ${ r.grant == 'Grant' ? 'active btn-primary' : ''}"><input
                                        type="radio" name="rdo${r.oid}" ng-click="updateGrant('${r.oid}', 'Grant', ${i.row})" value="Grant" /> <i
                                        class="fas fa-thumbs-up"></i> <span class="d-sm-none d-lg-inline">
                                        {{ 'ui.model.securityPolicyInstance.grant.Grant' | i18n }}</span></label>
                                        <label class="btn btn-info ${ r.grant == 'Deny' ? 'active btn-primary' : ''}"><input type="radio"
                                        name="rdo${r.oid}"  ng-click="updateGrant('${r.oid}', 'Deny', ${i.row})" value="Deny" /> <i class="fas fa-thumbs-down"></i>
                                        <span class="d-sm-none d-lg-inline">
                                        {{ 'ui.model.securityPolicyInstance.grant.Deny' | i18n }}</span></label>
                                        <label class="btn btn-info ${ r.grant == 'Elevate' ? 'active btn-primary' : ''}"><input
                                        type="radio" name="rdo${r.oid}"  ng-click="updateGrant('${r.oid}', 'Elevate', ${i.row})" value="Elevate" /> <i
                                        class="fas fa-arrow-circle-up"></i> <span class="d-sm-none d-lg-inline">
                                        {{ 'ui.model.securityPolicyInstance.grant.Elevate' | i18n }}</span></label>
                                        </div>`;
                            }
                        },
                        {
                            orderable: false,
                            render: function(d, t, r, i) {
                                return `<button class="btn btn-danger" type="button" id="delPolicy${i.row}" ng-click="deletePolicy('${r.oid}', ${i.row})"><i class="fas fa-times"></i> <span
                                class="d-sm-none d-lg-inline"> {{ 'ui.action.remove' | i18n }}</span></button>`;
                            }
                        }
                    ],
                    ajax: function (data, callback, settings) {

                        if(!scope.securable) { 
                            callback( { data: [], recordsFiltered: 0, recordsTotal: 0 } );
                            return;
                        }

                        var query = {};
                        if (data.search.value.length > 0)
                            query.name = `~${data.search.value}`;
                        
                        query["_count"] = data.length;
                        query["_offset"] = data.start;

                        SanteDB.resources[scope.securable.$type.toCamelCase()].findAssociatedAsync(scope.securable.id, 'policy', query)
                            .then(function (res) {
                                callback({
                                    data: res.item.map(function (item) {
                                        return item;
                                    }),
                                    recordsTotal: undefined,
                                    recordsFiltered: res.totalResults || res.size
                                });
                            })
                            .catch(function (err) { $rootScope.errorHandler(err) });
                    },
                    createdRow: function (r, d, i) {
                        $compile(angular.element(r).contents())(scope);
                        scope.$digest()
                    },
                });


                scope.refresh = function() {
                    dt.ajax.reload();
                }

                scope.$watch("securable", function(n, o) {
                    if(n)
                        dt.ajax.reload();
                });
                // Bind buttons
                var bindButtons = function () {
                    dt.buttons().container().appendTo($('.col-md-6:eq(1)', dt.table().container()));
                    if (dt.buttons().container().length == 0)
                        $timeout(bindButtons, 100);
                    else {
                        $("#addPolicy", element).appendTo($('.col-md-6:eq(0)', dt.table().container()));
                    }
                };
                bindButtons();

            }
        }
    }])
    /**
    * @summary Cocnept input drop down
    * @memberof Angular
    */
   .directive('conceptSelect', ['$rootScope', function ($rootScope) {

        var loaded = {};

       return {
           restrict: 'E',
           replace: true,
           require: 'ngModel',
           templateUrl:  './org.santedb.uicore/directives/conceptSelect.html',
           scope: {
               conceptSet: '=',
               conceptModel: '='
           },
           controller: ['$scope', '$rootScope', function ($scope, $rootScope) {
           }],
           link: function (scope, element, attrs, ngModel) {

            
                // Load concept set
                async function loadConceptSet(setName) {
                    try {
                        if(!loaded[setName]) 
                        {
                            loaded[setName] = { callme : [] };
                            scope.setValues = (await SanteDB.resources.concept.findAsync({ "conceptSet.mnemonic" : setName })).item;
                            loaded[setName].callme.forEach((r) => r(scope.setValues));
                            loaded[setName]= scope.setValues;
                            scope.$apply();
                        }
                        else {
                            if(Array.isArray(loaded[setName])) // loaded already
                                scope.setValues = loaded[setName];
                            else // still loading
                                loaded[setName].callme.push((r)=>scope.setValues = r); 
                        }
                        
                    }
                    catch(e) {
                        console.error(e);
                    }
                }

                loadConceptSet(scope.conceptSet);

                // Element has changed
                element.on('change', function (e) {
                    var val = $(element).val();
                    scope.$apply(() => ngModel.$setViewValue(scope.setValues.find(o=>o.id == val)));
                });
                ngModel.$render = function () {
                    if(ngModel.$viewValue) {
                        var value = ngModel.$viewValue.id;
                        $(element).val(value);
                    }
                };

                // HACK: Screw Select2 , it is so random
                //if(ngModel.$viewValue)
                //    scope.setValue(element, modelType, ngModel.$viewValue);

           }
       }
   }]);
;