/// <reference path="../../core/js/santedb.js"/>
/*
 * Copyright 2015-2018 Mohawk College of Applied Arts and Technology
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
 * User: justin
 * Date: 2018-7-26
 */

/// <reference path="./santedb-ui.js"/>

angular.module('santedb-lib', [])
    /**
     * @method i18n
     * @memberof Angular
     * @summary Renders a localized string
     */
    .filter('i18n', function () {
        return function (value) {
            return SanteDB.locale.getString(value);
        }
    })
    /**
     * @method identifier
     * @memberof Angular
     * @summary Renders a model value which is an EntityIdentifier in a standard way
     * @see {SanteDBModel.EntityIdentifier}
     * @example
     *      <div class="col-md-2">{{ patient.identifier | identifier }}</div>
     */
    .filter('identifier', function () {
        return function (modelValue) {
            if (modelValue === undefined)
                return "";
            if (modelValue.NID !== undefined)
                return modelValue.NID.value;
            else
                for (var k in modelValue)
                    return modelValue[k].value;
        };
    })
    /**
     * @method concept
     * @memberof Angular
     * @summary Renders a model concept into a standard display using the concept's display name
     * @see {SanteDBModel.Concept}
     * @example
     *      <div class="col-md-2">Gender:</div>
     *      <div class="col-md-2">{{ patient.genderConceptModel | concept }}</div>
     */
    .filter('concept', function () {
        return function (modelValue) {
            return SanteDB.display.renderConcept(modelValue);
        }
    })
    /**
     * @method name
     * @memberof Angular
     * @summary Renders an entity name to the display
     * @see {SanteDBModel.EntityName}
     * @param {string} nameType The type of name to render if the name is an array of names
     * @example
     *      <div class="col-md-2">Common Name:</div>
     *      <div class="col-md-2">{{ patient.name | name: 'OfficialRecord' }}</div>
     */
    .filter('name', function () {
        return function (modelValue, type) {
            return SanteDB.display.renderEntityName(modelValue, type);
        }
    })
    /**
     * @method address
     * @memberof Angular
     * @summary Renders an entity address to the display
     * @see {SanteDBModel.EntityAddress}
     * @param {string} type The type of address to render if the name is an array of names
     * @example
     *      <div class="col-md-2">Home Address:</div>
     *      <div class="col-md-2">{{ patient.address | address: 'Home' }}</div>
     */
    .filter('address', function () {
        return function (modelValue, type) {
            return SanteDB.display.renderEntityAddress(modelValue, type);
        }
    })
    /**
     * @method extDate
     * @memberof Angular
     * @summary Renders an extended date with a specified precision
     * @param {string} precision The precision of the date to render
     * @example
     *      <div class="col-md-2">Date Of Birth:</div>
     *      <div class="col-md-2">{{ patient.dateOfBirth | extDate: patient.dateOfBirthPrecision }}</div>
     */
    .filter('extDate', function () {
        return function (date, precision) {
            var dateFormat;

            switch (precision) {
                case 1:   // Year     "Y"
                case 'Y':
                    dateFormat = SanteDB.locale.dateFormats.year;
                    break;
                case 2:   // Month    "m"
                case 'm':
                    dateFormat = SanteDB.locale.dateFormats.month;
                    break;
                case 3:   // Day      "D"
                case 'D':
                    dateFormat = SanteDB.locale.dateFormats.day;
                    break;
                case 4:   // Hour     "H"
                case 'H':
                    dateFormat = SanteDB.locale.dateFormats.hour;
                    break;
                case 5:   // Minute   "M"
                case 'M':
                    dateFormat = SanteDB.locale.dateFormats.minute;
                    break;
                case 6:   // Second   "S"
                case 'S':
                case 0:   // Full     "F"
                case 'F':
                default:
                    dateFormat = SanteDB.locale.dateFormats.second;
                    break;
            }

            if (date) {
                // Non timed
                switch (format) {
                    case 1:   // Year, Month, Day always expressed in UTC for Javascript will take the original server value and adjust.
                    case 'Y':
                    case 2:
                    case 'm':
                    case 3:
                    case 'D':
                        return moment(date).utc().format(dateFormat);
                    default:
                        return moment(date).format(dateFormat);
                }
            }

            return null;
        }
    })
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
     * <entity-search type="Place" 
                    class="form-control" 
                    name="subscribeFacility" 
                    ng-model="config.subscription.facility" 
                    filter='{ "statusConcept.mnemonic" : "ACTIVE" }'/>
     */
    .directive('entitySearch', function ($timeout) {

        var renderObject = function (selection) {

            if(selection.text)
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
                case "Entity":
                    retVal += "<i class='fa fa-share-alt'></i> ";
                    break;
                case "AssigningAuthority":
                    retVal += "<i class='fa fa-id-card'></i> ";
                    break;
                default:
                    retVal += "<i class='fa fa-box'></i> ";
                    break;
            }
            retVal += "&nbsp;";


            if (selection.name != null && selection.name.OfficialRecord != null)
                retVal += SanteDB.display.renderEntityName(selection.name.OfficialRecord);
            else if (selection.name != null && selection.name.Assigned != null)
                retVal += SanteDB.display.renderEntityName(selection.name.Assigned);
            else if (selection.name != null && selection.name.$other != null)
                retVal += SanteDB.display.renderEntityName(selection.name.$other);
            else if(selection.name != null)
                retVal += selection.name;
            else if (selection.element !== undefined)
                retVal += selection.element.innerText.trim();
            else if (selection.text)
                retVal += selection.text;

            if (selection.address) 
                retVal += " - <small>(<i class='fa fa-map-marker'></i> " + SanteDB.display.renderEntityAddress(selection.address) + ")</small>";
            else if(selection.oid)
                retVal += " - <small>(<i class='fa fa-cogs'></i> " + selection.oid +")</small>";
            return retVal;
        }

        return {
            scope: {
                defaultResults: '='
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
                            value.forEach(function (v) {
                                api.getAsync(v)
                                    .then(function (res) {

                                        if($(selectControl).find(`option[value=${v}]`).length == 0) {
                                            $(selectControl)[0].add(new Option(renderObject(res), v, false, true));
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
                    var modelType = attrs.model || attrs.type;
                    var filterString = attrs.filter;
                    var displayString = attrs.display;
                    var searchProperty = attrs.searchField || "name.component.value";
                    var defaultResults = attrs.default;
                    var groupString = attrs.groupBy;
                    var groupDisplayString = attrs.groupDisplay;
                    var resultProperty = attrs.resultfield || "id";
                    var filter = {}, defaultFilter = {};
                    if (filterString !== undefined)
                        filter = JSON.parse(filterString);

                    // Bind select 2 search
                    $(element).select2({
                        defaultResults: function () {
                            var s = scope;
                            if (defaultResults) {
                                try {
                                    return eval(defaultResults);
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
                            url: ((modelType == "SecurityUser" || modelType == "SecurityRole") ? "/ami/" : "/hdsi/") + modelType,
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
                                filter["_viewModel"] = "min";
                                return filter;
                            },
                            processResults: function (data, params) {
                                //params.page = params.page || 0;
                                var data = data.$type == "Bundle" ? data.item : data.item || data;
                                var retVal = { results: [] };

                                if (groupString == null && data !== undefined) {
                                    retVal.results = retVal.results.concat($.map(data, function (o) {
                                        var text = "";
                                        if (displayString) {
                                            scope = o;
                                            text = eval(displayString);
                                        }
                                        else if (o.name !== undefined) {
                                            text = renderObject(o);
                                        }
                                        o.text = o.text || text;
                                        o.id = o[resultProperty];
                                        return o;
                                    }));
                                }
                                else {
                                    // Get the group string
                                    for (var itm in data) {
                                        // parent obj
                                        try {
                                            var scope = eval('data[itm].' + groupString);
                                            var groupDisplay = "";
                                            if (groupDisplayString != null)
                                                groupDisplay = eval(groupDisplayString);
                                            else
                                                groupDisplay = scope;

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
                    element.on('select2:select', function (e) {
                        var val = $(element).select2("val");
                        //e.currentTarget.options.selectedIndex = e.currentTarget.options.length - 1;
                        scope.$apply(() => ngModel.$setViewValue(val));
                    });
                    ngModel.$render = function () {
                        scope.setValue(element, modelType, ngModel.$viewValue);
                    };
                });
            }
        };
    })
    /**
     * @summary Directive for rendering a table of entities
     */
    .directive('entityTable', ['$timeout','$compile','$rootScope', function($timeout, $compile, $rootScope) {
        var dt = null;
        return {
            scope : {
                properties: "=",
                external: "=",
                defaultQuery: "=",
                itemActions: "=",
                actions: "="
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

                $timeout(function() {
                    
                    scope.translatePrefix = attrs.translatePrefix;
                    scope.propertyPath = attrs.propertyPath;
    
                    var columns = scope.properties.map(function(m) {
                        return {
                            data: m,
                            render: m.indexOf("Time") > -1 ? function(d, t, r) {
                                return moment(d).format(SanteDB.locale.dateFormats.second);
                            } : null
                        };
                    });
                    columns.unshift({ data: "id", visible: false });
        
                    // Buttons
                    var buttons = (scope.actions || []).map(function(b) {
                        return {
                            text: `<i class="${b.icon}"></i> ` + SanteDB.locale.getString((scope.translatePrefix || 'ui.action.') + b.name),
                            className: `btn ${b.className || 'btn-default' }`,
                            action : function(e, dt, node, config) {
                                alert('clicked!');
                            }
                        }
                    });

                    // Add refresh button
                    buttons.push(
                        {
                            text: "<i class='fas fa-sync-alt'></i> " + SanteDB.locale.getString("ui.action.reload"),
                            className: "btn btn-info",
                            action: function(e, dt, node, config)  {
                                dt.ajax.reload();
                            }
                        }
                    );

                    dt = $("table", element).DataTable({
                        lengthChange: false,
                        buttons: buttons,
                        serverSide: true,
                        "language": {
                            "infoFiltered": ""
                        },
                        ajax: function (data, callback, settings) {
    
                            var query = scope.defaultQuery || {};
                            if (data.search.value.length > 0)
                                query[attrs.searchField] = `~${data.search.value}`;
                            if (data.order[0].column != 0) {
                                var colname = scope.properties[data.order[0].column - 1]; // -1 because the ID column is hidden
                                query["_orderBy"] = `${colname}:${data.order[0].dir}`;
                            }
                            if(scope.extenral)
                                query["_extern"] = true;
    
                            query["_count"] = data.length;
                            query["_offset"] = data.start;
    
                            SanteDB.resources[attrs.type.toCamelCase()].findAsync(query)
                                .then(function (res) {
                                    callback({
                                        data: res.item.map(function(item) {
                                            if(scope.propertyPath)
                                                return item[scope.propertyPath];
                                            else 
                                                return item;
                                        }),
                                        recordsTotal: undefined,
                                        recordsFiltered: res.totalResults || res.size
                                    });
                                })
                                .catch(function(err) { $rootScope.errorHandler(err) });
                        },
                        createdRow: function(r, d, i) { $compile(angular.element(r).contents())(scope); },
                        columns: columns
                    });
    
                    $timeout(function() {  dt.buttons().container().appendTo($('.dataTables_wrapper .col-md-6:eq(0)', element)); }, 500);
                });
            }
        };
    }])
    .factory('AuthInterceptor', ['$rootScope', '$q', '$window', '$location', '$injector', function ($rootScope, $q, $window, $location, $injector) {
        return {
            request: function (config) {
                config.headers = config.headers || {};
                if (window.sessionStorage.getItem('token')) {
                    config.headers.Authorization = 'BEARER ' + window.sessionStorage.getItem('token');
                }
                return config;
            },

            responseError: function (response) {
                if (response.status === 401) {
                    var oldState = $injector.get('$state').$current.name;
                    $injector.get('$state').transitionTo('login', {
                        returnState: oldState == "login" ? null : oldState
                    });
                    window.sessionStorage.removeItem('token');// obvi this token doesn't work
                    return $q.reject(response);;
                }
                return $q.reject(response);
            }
        };
    }]);