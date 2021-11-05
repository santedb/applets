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

/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>

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

        function extractProperty(object, path) {
            var r = object;
            path.split(/[\.\[\]]/).forEach((p) => {
                try { if ("" != p) r = r[p] || r['$other'][p]; }
                catch (e) { if (r['$other']) r['$other'][p]; }
            });
            return r;
        }
        function renderObject(selection, minRender) {

            if (selection.text)
                return selection.text;

            var retVal = "";
            switch (selection.$type) {
                case "Patient":
                    retVal += "<i class='fa fa-user-hospital'></i> ";
                    break;
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
                    if (selection.classConcept == EntityClassKeys.ServiceDeliveryLocation)
                        retVal += "<i class='fa fa-hospital'></i> ";
                    else
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

            if (selection.name != null)
                retVal += SanteDB.display.renderEntityName(selection.name);
            else if (selection.name != null && selection.name[SanteDB.locale.getLocale()])
                retVal += selection.name[SanteDB.locale.getLocale()];
            else if (selection.name != null)
                retVal += selection.name;
            else if (selection.userName)
                retVal += selection.userName;
            else if (selection.mnemonic)
                retVal += SanteDB.locale.getString(selection.mnemonic);
            else if (selection.entity)
                retVal += (selection.entity.name || selection.entity.userName);
            else if (selection.element !== undefined)
                retVal += selection.element.innerText.trim();
            else if (selection.text)
                retVal += selection.text;

            retVal += "&nbsp;";
            if(!minRender) {
                if (selection.address)
                    retVal += "<small class='d-none d-sm-inline'> - (<i class='fa fa-map-marker'></i> " + SanteDB.display.renderEntityAddress(selection.address) + ")</small>";
                else if (selection.oid)
                    retVal += "<small class='d-none d-sm-inline'> - (<i class='fa fa-cogs'></i> " + selection.oid + ")</small>";
            }
            if (selection.classConceptModel && !selection.typeConceptModel)
                retVal += ` <span class='badge badge-secondary'>${SanteDB.display.renderConcept(selection.classConceptModel)}</span>`;
            else if (selection.typeConceptModel) {
                retVal += `<span class="badge badge-secondary">${SanteDB.display.renderConcept(selection.typeConceptModel)}</span> `;
            }

            return retVal;
        }

        return {
            scope: {
                type: '<',
                display: '<',
                searchField: '<',
                defaultResults: '<',
                groupBy: '<',
                filter: '=',
                groupDisplay: '<',
                key: '<',
                selector: '<',
                valueProperty: '<',
                multiSelect: '<',
                autoTabNext: '<',
                copyNulls: '<',
                minRender: '<',
                changeClear: '<'
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

                            $(selectControl).find('option').each((idx, ele) => {
                                var val = $(ele).val();
                                if (val == 'loading' ||
                                    /\?.*\?/i.test(val))
                                    $(ele).remove();
                            });
                            $(selectControl)[0].add(new Option(`<i class='fa fa-circle-notch fa-spin'></i> ${SanteDB.locale.getString("ui.wait")}`, "loading", true, true));

                            value.filter(o=>o).forEach(async function (v) {

                                if ($scope.valueProperty && v[$scope.valueProperty])
                                    v = v[$scope.valueProperty];

                                try {
                                    if ($scope.key && $scope.key != "id") {
                                        var query = angular.copy($scope.filter || {});
                                        query[$scope.key] = v;
                                        query._viewModel = "dropdown";
                                        var res = await api.findAsync(query);
                                        // Matching item
                                        if (res.resource.length == 1 && $(selectControl).find(`option[value='${v}']`).length == 0) {
                                            var obj = res.resource[0];
                                            if ($scope.selector)
                                                obj = obj[$scope.selector] || obj;
                                            $(selectControl)[0].add(new Option(renderObject(res.resource[0], $scope.minRender), v, false, true));
                                        }
                                    }
                                    else {
                                        var res = await api.getAsync({ id: v, viewModel: "dropdown" });
                                        if ($(selectControl).find(`option[value='${v}']`).length == 0) {
                                            var obj = res;
                                            if ($scope.selector)
                                                obj = obj[$scope.selector] || obj;
                                            $(selectControl)[0].add(new Option(renderObject(obj, $scope.minRender), v, false, true));
                                        }
                                    }
                                }
                                catch (e) {
                                    console.warn(`Could not fetch object ${e}`);
                                }
                                finally {
                                    $(selectControl).find("option[value='loading']").remove();
                                    $(selectControl).trigger('change.select2');
                                }

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

                    scope.$watch('filter', function (n, o) {
                        if (n != o && n)
                            filter = n;
                    });
                    // Bind select 2 search
                    var select2 = $(element).select2({
                        language: {
                            searching: function () { return `<i class="fa fa-circle-notch fa-spin"></i> ${SanteDB.locale.getString("ui.search")}`; }
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

                                if (params.term)
                                    filter[searchProperty] = "~" + params.term;
                                filter["_count"] = 20;
                                filter["_offset"] = params.page ? params.page * 20 : 0;
                                filter["_viewModel"] = "dropdown";
                                return filter;
                            },
                            processResults: function (data, params) {
                                //params.page = params.page || 0;

                                var retVal = { results: [], pagination: { more: data.totalResults > data.count } };
                                var data = data.$type == "Bundle" ? data.resource : data.resource || data;

                                try {
                                    if (!data || data.length == 0) return [];
                                    if (groupString == null && data !== undefined) {
                                        retVal.results = retVal.results.concat($.map(data, function (o) {

                                            if (selector && o[selector])
                                                o = o[selector];

                                            var text = "";
                                            if (displayString) {
                                                text = scope.$eval(displayString, { scope: o });
                                            }
                                            else if (o.name !== undefined) {
                                                text = renderObject(o, scope.minRender);
                                            }
                                            o.text = o.text || text;
                                            o.id = extractProperty(o, resultProperty) || o.id;
                                            return o;
                                        }));
                                    }
                                    else {
                                        // Get the group string
                                        var objs = data.map(function (o) {

                                            if (selector && o[selector])
                                                o = o[selector];

                                            var text = "";
                                            if (displayString) {
                                                text = scope.$eval(displayString, { scope: o });
                                            }
                                            else if (o.name !== undefined) {
                                                text = renderObject(o, scope.minRender);
                                            }
                                            o.text = o.text || text;
                                            o.id = extractProperty(o, resultProperty) || o.id;
                                            return o;
                                        });

                                        for (var itm in objs) {
                                            // parent obj
                                            try {
                                                var groupDisplay = scope.$eval('scope.' + groupString, { scope: data[itm] });

                                                if (!groupDisplay)
                                                    retVal.results.push(data[itm]);
                                                else {
                                                    var gidx = $.grep(retVal.results, function (e) { return e.text == groupDisplay });
                                                    if (gidx.length == 0)
                                                        retVal.results.push({ "text": groupDisplay, "children": [data[itm]] });
                                                    else
                                                        gidx[0].children.push(data[itm]);
                                                }
                                            }
                                            catch (e) {
                                                retVal.results.push(data[itm]);
                                            }
                                        }
                                    }

                                    return retVal;
                                }
                                catch (e) {
                                    console.error(e);
                                    return [];
                                }
                            },
                            cache: true
                        },
                        escapeMarkup: function (markup) { return markup; }, // Format normally
                        templateSelection: function(o) { return renderObject(o, scope.minRender); },
                        keepSearchResults: true,
                        templateResult: function(o) { return renderObject(o, scope.minRender); }
                    });

                    // // on first focus (bubbles up to document), open the menu
                    $(element).parent().on('focusin', '.select2-selection.select2-selection--single', function (e) {
                        $(this).closest(".select2-container").siblings('select:enabled').select2('open');
                    });
                    
                    //   // steal focus during close - only capture once and stop propogation
                    if(scope.autoTabNext)
                        $($(element).parent(), 'select.select2').on('select2:close', function (e) {
                            $(element).trigger("focusout");

                            // HACK: Focus the next form-control on close
                            var controls = $('.form-control');
                            var eindex = -1;
                            controls.each(function(i, e) { if(e.name == element[0].name) eindex = i; });
                            if(eindex > -1) {
                                var nextControl = controls[eindex + 1].name;
                                e.stopPropagation();
                                $(`[name=${nextControl}]`).focus();
                            }
                        });
                    // On change
                    element.on('change', function (e) {
                        var val = $(element).select2("val");

                        // Remove loading indicator
                        if (Array.isArray(val))
                            val = val.filter(o => o != "loading");

                        // Is there a copy command
                        if(scope.copyNulls && !Array.isArray(val)) {
                            var data = $(element).select2("data")[0];

                            var target = scope.copyNulls.to;
                            var from = scope.copyNulls.from.split('.').reduce((p, c, i) => i == 1 ? data[p][c] : p[c]);
                            scope.copyNulls.values.forEach(o=>target[o] = target[o] || from[o] );

                        }
                        if(scope.changeClear && val != ngModel.$viewValue && scope.changeClear.scope) {
                            scope.changeClear.values.forEach(o=>scope.changeClear.scope[o] = null);
                        }
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
                    if (ngModel.$viewValue)
                        scope.setValue(element, modelType, ngModel.$viewValue);

                });
            }
        };
    });