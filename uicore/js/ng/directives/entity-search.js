/*
 * Copyright (C) 2021 - 2025, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Portions Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
 * Portions Copyright (C) 2015-2018 Mohawk College of Applied Arts and Technology
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
    // TODO: CLEAN THIS UP PLEASE!
    .directive('entitySearch', function ($timeout) {

        function renderTitle(selection) {

            var retVal = "";
            if (selection.name != null)
                retVal = SanteDB.display.renderEntityName(selection.name);
            else if (selection.name != null && selection.name[SanteDB.locale.getLocale()])
                retVal = selection.name[SanteDB.locale.getLocale()];
            else if (selection.name != null)
                retVal = selection.name;
            else if (selection.userName)
                retVal = selection.userName;
            else if (selection.mnemonic)
                retVal = SanteDB.locale.getString(selection.mnemonic);
            else if (selection.entity)
                retVal = (selection.entity.name || selection.entity.userName);
            else if (selection.element !== undefined)
                retVal = selection.element.innerText.trim();
            else if (selection.text)
                retVal = selection.text;

            if (selection.$type) {
                retVal += " (" + selection.$type + ")";
            }
            return retVal;
        }

        function renderObject(selection, minRender) {

            
            // Clearing text breaks  grouping display - ensure that there are no children before clearing text
            // Also need to preserve placeholder and preserve the loading 
            if (!selection.children &&
                !selection.loading &&
                selection.id != "" &&
                !selection.title) {
                selection.text = '';
            }

            if (selection.text)
                return selection.text;

            var retVal = "";
            switch (selection.$type) {
                case "Patient":
                    retVal += "<i class='fa fa-fw fa-hospital-user'></i> ";
                    break;
                case "UserEntity":
                case "Provider":
                case "Person":
                    retVal += "<i class='fa fa-fw fa-user'></i> ";
                    break;
                case "Material":
                    retVal += "<i class='fa fa-fw fa-flask'></i> ";
                    break;
                case "ManufacturedMaterial":
                    retVal += "<i class='fa fa-fw fa-prescription-bottle'></i>";
                    break;
                case "Place":
                    if (selection.classConcept == EntityClassKeys.ServiceDeliveryLocation)
                        retVal += "<i class='fa fa-fw fa-hospital'></i> ";
                    else
                        retVal += "<i class='fa fa-fw fa-map-pin'></i>";
                    break;
                case "Organization":
                    retVal += "<i class='fa fa-fw fa-sitemap'></i> ";
                    break;
                case "Entity":
                    retVal += "<i class='fa fa-fw fa-share-alt'></i> ";
                    break;
                case "IdentityDomain":
                    retVal += "<i class='fa fa-fw fa-id-card'></i> ";
                    break;
                case "SecurityRole":
                case "SecurityRoleInfo":
                case "SanteDB.Core.Model.AMI.Auth.SecurityRoleInfo, SanteDB.Core.Model.AMI":
                    retVal += "<i class='fa fa-fw fa-users'></i>";
                    break;
                case "SecurityUser":
                case "SecurityUserInfo":
                case "SanteDB.Core.Model.AMI.Auth.SecurityUserInfo, SanteDB.Core.Model.AMI":
                    retVal += "<i class='fa fa-fw fa-user'></i>";
                    break;
                case "Concept":
                case "CodeSystem":
                    retVal += "<i class='fa fa-fw fa-book-medical'></i>";
                    break;
                case "SecurityPolicy":
                case "SecurityPolicyInstance":
                    retVal += "<i class='fa fa-fw fa-certificate'></i>";
                    break;
                default:
                    if (selection.icon) {
                        retVal += `<i class='${selection.icon}'></i> `;
                    }
                    else if (selection.text && selection.text != "") {
                        retVal += "<i class='fa fa-fw fa-box'></i> ";
                    }
                    break;
            }

            retVal += "&nbsp;";

            if (selection.lotNumber) {
                retVal += `${selection.lotNumber} - `;
            }

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
            else if (selection.authority) {
                retVal += SanteDB.locale.getString(selection.authority);

            }
            else if (selection.entity)
                retVal += (selection.entity.name || selection.entity.userName);
            else if (selection.element !== undefined)
                retVal += selection.element.innerText.trim();
            else if (selection.text)
                retVal += selection.text;

            if (selection.expiryDate && selection.expiryDate.getYear() > 0) 
            {
                if(selection.expiryDate > new Date()) {
                    retVal += ` <span class="badge badge-primary">EXP: ${moment(selection.expiryDate).format("YYYY-MM-DD")}</span>`;
                }
                else {
                    retVal += ` <span class="badge badge-warning">EXP: ${moment(selection.expiryDate).format("YYYY-MM-DD")}</span>`;
                }
            }

            retVal += "&nbsp;";

            if (!minRender) {
                if (selection.securityUserModel)
                    retVal += `<span class='d-non d-sm-inline'><i class='fas fa-fw fa-shield-alt'></i> ${selection.securityUserModel.userName}</span> `;
                if (selection.address)
                    retVal += "<small class='d-none d-sm-inline'>- (<i class='fa fa-map-marker'></i> " + SanteDB.display.renderEntityAddress(selection.address) + ")</small>";
                else if (selection.oid)
                    retVal += "<small class='d-none d-sm-inline ml-2'> - (<i class='fa fa-cogs'></i> " + selection.oid + ")</small>";
                else if (selection.mnemonic)
                    retVal += `<small class='d-none d-sm-inline ml-2'>(${selection.mnemonic})</small>`;
            }

            if (selection.classConceptModel && !selection.typeConceptModel)
                retVal += ` <span class='badge badge-secondary ml-1'>${SanteDB.display.renderConcept(selection.classConceptModel)}</span>`;
            else if (selection.typeConceptModel) {
                retVal += `<span class="badge badge-secondary ml-1">${SanteDB.display.renderConcept(selection.typeConceptModel)}</span> `;
            }

            if (selection.identifier) {
                retVal += `<small class="ml-2 d-none d-sm-inline badge badge-info"><i class="fas fa-id-card"></i> ${SanteDB.display.renderIdentifier(selection.identifier, null, true)}</small>`;
            }

            return retVal;
        }

        return {
            scope: {
                type: '=', // The type of object to be searched
                childResource: '<', // The child resource to query on
                childResourceScope: '=', // The child resource to query on
                searchField: '<', // The field on the server to search results for
                defaultResults: '=', // The default results to show
                groupBy: '<', // If grouping results (by country, by state, etc.) the grouping expression
                filter: '=', // The filter to apply in addition to the searchField
                key: '<', // When the default value is provided by the ng-model - this is the property where the resolution should occur (i.e. if the current value is CA and the key is identifier[ISO3166].value then the server will be searched for that filter field)
                selector: '<', // When values are returned from the server - this is the expression to use to extract the value of the <options>
                valueProperty: '<', // If the object on ng-model is bound to a complex object instead of a string, this is the path on that object to fetch the value from
                valueSelector: '<', // If the <options> in the drop down are complex objects, this is the expression to extract the value ot pass to ng-model
                multiSelect: '<', // True if multiple options can be set
                autoTabNext: '<', // True if the control should tab to the next control
                copyNulls: '<', // 
                minRender: '<', // The minimum number of results to fetch
                changeClear: '<', // When the object is selected, these are the dependent fields to clear
                isRequired: '=', // True if the selector is required
                forRelationshipType: '=', // If this is the target of the relationship then the default query can be auto-populated with this information
                withRelationshipSourceClass: '=', // The class concept of the source object
                withRelationshipTargetClass: '=', // The class concept of the target object
                jsFilter: '<',
                upstream: '<',
                viewModel: "<"
            },
            restrict: 'E',
            require: 'ngModel',
            replace: true,
            transclude: true,
            templateUrl: './org.santedb.uicore/directives/entitySearch.html',
            controller: ['$scope', '$rootScope',
                function ($scope, $rootScope) {

                    $scope.setValue = (selectControl, resource, value, displayString) => {
                        if (!value || Array.isArray(value) && value.length == 0) {
                            $(selectControl).find('option').remove();
                            $(selectControl).trigger('change.select2');
                        }
                        else {
                            try {
                                var api = SanteDB.resources[resource.toCamelCase()];

                                if (!Array.isArray(value))
                                    value = [value];

                                $(selectControl).find('option').each((idx, ele) => {
                                    var val = $(ele).val();
                                    if (val == 'loading' ||
                                        /\?.*\?/i.test(val))
                                        $(ele).remove();
                                });
                                if ($(selectControl)[0].length == 0) {
                                    $(selectControl)[0].add(new Option(`<i class='fa fa-circle-notch fa-spin'></i> ${SanteDB.locale.getString("ui.wait")}`, "loading", true, true));
                                }

                                value.filter(o => o).forEach(async function (v) {
                                    try {

                                        if ($scope.valueProperty) {
                                            if (v[$scope.valueProperty]) {
                                                v = v[$scope.valueProperty];
                                            }
                                            else {
                                                return;
                                            }
                                        }

                                        if ($scope.key && $scope.key != "id") {
                                            var query = angular.copy($scope.filter || {});
                                            query[$scope.key] = v;
                                            query._viewModel = $scope.viewModel || "dropdown";
                                            query._upstream = $scope.upstream;
                                            var res = null;
                                            if ($scope.childResource) {
                                                res = await api.findAssociatedAsync($scope.childResourceScope, $scope.childResource, query, $scope.viewModel || "dropdown", $scope.upstream);
                                            }
                                            else {
                                                res = await api.findAsync(query);
                                            }

                                            var results = Array.isArray(res) ? res : res.resource;

                                            // Matching item
                                            if (results.length == 1 && $(selectControl).find(`option[value='${v}']`).length == 0) {
                                                var obj = results[0];
                                                if ($scope.selector)
                                                    obj = obj[$scope.selector] || obj;

                                                var text = "";

                                                if (displayString) {
                                                    text = $scope.$eval(displayString, { item: obj, display: SanteDB.display });
                                                }
                                                else if (obj.name !== undefined) {
                                                    text = renderObject(obj, $scope.minRender);
                                                }

                                                var option = new Option(text, v, false, true);
                                                option.title = renderTitle(results[0]);
                                                $(selectControl)[0].add(option);
                                            }
                                        }
                                        else {
                                            var res = null;

                                            if ($scope.childResource) {
                                                res = await api.getAssociatedAsync($scope.childResourceScope, $scope.childResource, v.id || v, { _viewModel: $scope.viewModel || "dropdown" }, $scope.upstream);
                                            }
                                            else {
                                                res = await api.getAsync({ id: v && v.id ? v.id : v, viewModel: $scope.viewModel || "dropdown", _upstream: $scope.upstream });
                                            }

                                            if ($(selectControl).find(`option[value='${v}']`).length == 0) {
                                                var obj = res;
                                                if ($scope.selector)
                                                    obj = obj[$scope.selector] || obj;

                                                var text = "";
                                                if (displayString) {
                                                    text = $scope.$eval(displayString, { item: obj, display: SanteDB.display });
                                                }
                                                else if (obj.name !== undefined) {
                                                    text = renderObject(obj, $scope.minRender);
                                                }

                                                var option = new Option(text, v, false, true);
                                                option.title = renderTitle(obj);
                                                $(selectControl)[0].add(option);
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

                                if (selectControl[0].form) {
                                    var form = SanteDB.display.getParentScopeVariable($scope, selectControl[0].form.name);
                                    if (form && form[selectControl[0].name]) {
                                        form[selectControl[0].name].$setValidity("required", true);
                                    }
                                }
                            }
                            finally {
                                $(selectControl).find("option[value='loading']").remove();

                            }
                        }
                    }
                }
            ],
            link: function (scope, element, attrs, ngModel) {

                if (!$(element).attr('id')) {
                    $(element).attr('id', SanteDB.application.newGuid().replace(/\-/g, '_'));
                }

                // Extract property
                function extractProperty(object, path) {
                    var r = object;
                    path.split(/[\.\[\]]/).forEach((p) => {
                        try { if ("" != p) r = r[p] || r['$other'][p]; }
                        catch (e) { if (r['$other']) r['$other'][p]; }
                    });

                    if (r) {
                        return r;
                    }
                    else {
                        return scope.$eval(`item.${path}`, { item: object });
                    }
                }

                $timeout(function () {
                    var filter = scope.filter || { statusConcept: [StatusKeys.Active, StatusKeys.New] };;
                    var displayString = attrs.display;
                    var searchProperty = scope.searchField;
                    var groupString = scope.groupBy;
                    var groupDisplayString = attrs.groupDisplay;
                    var resultProperty = scope.valueSelector || scope.key || "id";
                    var selector = scope.selector;
                    var valueProperty = scope.valueProperty;
                    var lastRuleCheck = null;

                    if (!searchProperty) {
                        switch (scope.type) {
                            case "Entity":
                            case "Patient":
                            case "Person":
                            case "Organization":
                            case "UserEntity":
                            case "Place":
                            case "Material":
                            case "ManufacturedMaterial":
                                searchProperty = "name.component.value";
                                break;
                            case "Concept":
                                searchProperty = "name.value";
                                break;
                            default:
                                searchProperty = 'identifier.value';
                        }
                    }

                    $(element).find('option[value="? undefined:undefined ?"]').remove();

                    scope.$watch('filter', function (n, o) {
                        if (n != o && n) {
                            filter = n;
                        }
                    });

                    // Is this part of a relationship? 
                    if (scope.forRelationshipType) {
                        scope.$watch(s => s.forRelationshipType + (s.withRelationshipSourceClass || s.withRelationshipTargetClass), async function (n, o) {
                            // We want to set the filter based on allowable types
                            if (n && lastRuleCheck != n) {
                                lastRuleCheck = n;
                                var serverRules = (await SanteDB.resources.entityRelationship.findAssociatedAsync(null, '_relationshipRule', {
                                    sourceClass: scope.withRelationshipSourceClass,
                                    targetClass: scope.withRelationshipTargetClass,
                                    relationshipType: scope.forRelationshipType
                                }, null, scope.upstream)).resource;
                                if (serverRules && serverRules.length > 0) {
                                    filter.classConcept = serverRules.map(o => scope.withRelationshipSourceClass ? o.targetClass : o.sourceClass).filter(o => !scope.filter?.classConcept || scope.filter?.classConcept == o || scope.filter?.classConcept?.includes(o));
                                }
                            }
                        });
                    }

                    // Does the drop-down exist in a modal? If so - set the parent
                    var dropDownParent = $(element).parents('.modal-body');
                    // Bind select 2 search
                    var select2 = $(element).select2({
                        language: {
                            searching: function () { return `<i class="fa fa-circle-notch fa-spin"></i> ${SanteDB.locale.getString("ui.search")}`; }
                        },
                        minimumResultsForSearch: attrs.noSearch ? Infinity : 0,
                        dropdownParent: dropDownParent.length > 0 ? dropDownParent : null,
                        dataAdapter: $.fn.select2.amd.require('select2/data/extended-ajax'),
                        ajax: {

                            url: () => scope.childResource ?
                                scope.childResourceScope ?
                                    `${SanteDB.resources[scope.type.toCamelCase()].getUrl()}/${scope.childResourceScope}/${scope.childResource}` :
                                    `${SanteDB.resources[scope.type.toCamelCase()].getUrl()}/${scope.childResource}` :
                                SanteDB.resources[scope.type.toCamelCase()].getUrl(), //((modelType == "SecurityUser" || modelType == "SecurityRole" || modelType == "SecurityPolicy") ? "/ami/" : "/hdsi/") + modelType,
                            dataType: 'json',
                            delay: 500,
                            method: "GET",
                            headers: {
                                "Accept": "application/x.santedb.rim.viewModel+json", // "application/json+sdb-viewmodel",
                                "X-SDB-ViewModel": scope.viewModel || "dropdown"
                            },
                            data: function (params) {

                                // Remove previous filters 
                                delete (filter[searchProperty]);
                                if (scope.defaultResults)
                                    Object.keys(scope.defaultResults).forEach(k => delete (filter[k]));

                                if (params.term) {
                                    filter[searchProperty] = "~" + params.term;
                                }
                                else if (scope.defaultResults) {
                                    Object.keys(scope.defaultResults).forEach(k => filter[k] = scope.defaultResults[k]);
                                }
                                filter["_count"] = 25;
                                filter["_offset"] = params.page ? params.page * 10 : 0;
                                filter["_viewModel"] = scope.viewModel || "dropdown";

                                if (scope.upstream) {
                                    filter["_upstream"] = true;
                                }
                                return filter;
                            },
                            processResults: function (data, params) {
                                //params.page = params.page || 0;

                                var retVal = { results: [], pagination: { more: data.totalResults > data.count } };
                                var data = (data.$type == "Bundle" ? data.resource : data.resource || data) || [];

                                if (scope.jsFilter) {

                                    if (typeof scope.jsFilter === "string") {
                                        scope.jsFilter = SanteDB.display.getParentScopeVariable(scope, scope.jsFilter);
                                    }
                                    data = data.filter(flt => scope.jsFilter(flt));
                                }

                                try {
                                    if (!data || data.length == 0) return [];
                                    if (groupString == null && data !== undefined) {
                                        retVal.results = retVal.results.concat($.map(data, function (o) {

                                            if (selector) {
                                                if (o[selector]) {
                                                    o = o[selector];
                                                }
                                                else {
                                                    o = scope.$eval(`item.${selector}`, { item: o });
                                                }
                                            }

                                            var text = "";
                                            if (displayString) {
                                                text = scope.$eval(displayString, { item: o, display: SanteDB.display });
                                            }
                                            else if (o.name !== undefined) {
                                                text = renderObject(o, scope.minRender);
                                            }
                                            o.text = o.text || text;
                                            o.title = renderTitle(o);
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
                                            o.title = renderTitle(o);
                                            o.id = extractProperty(o, resultProperty) || o.id;
                                            return o;
                                        });

                                        for (var itm in objs) {
                                            // parent obj
                                            try {
                                                var groupDisplay = null;
                                                if (Array.isArray(groupString)) {
                                                    groupDisplay = groupString.map(o => scope.$eval('item.' + o, { item: data[itm], display: SanteDB.display })).find(o => o != null);
                                                }
                                                else {
                                                    groupDisplay = scope.$eval('item.' + groupString, { item: data[itm], display: SanteDB.display });
                                                }

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
                        templateSelection: function (o) { return renderObject(o, scope.minRender); },
                        keepSearchResults: true,
                        templateResult: function (o) { return renderObject(o, scope.minRender); },
                        placeholder: SanteDB.locale.getString(`ui.table.search.field.${searchProperty}`),
                        allowClear: true
                    });

                    // On change
                    element.on('change', function (e) {
                        var val = $(element).select2("val");

                        // Remove loading indicator
                        if (Array.isArray(val))
                            val = val.filter(o => o != "loading");

                        // Is there a copy command
                        if (scope.copyNulls && !Array.isArray(val)) {
                            var data = $(element).select2("data")[0];

                            var target = scope.copyNulls.to;
                            var from = scope.copyNulls.from.split('.').reduce((p, c, i) => i == 1 ? data[p][c] : p[c]);
                            scope.copyNulls.values.forEach(o => target[o] = target[o] || from[o]);
                        }

                        if (scope.changeClear && val != ngModel.$viewValue && scope.changeClear.scope) {
                            scope.changeClear.values.forEach(o => {
                                console.info(scope.changeClear.resetTo);
                                scope.changeClear.scope[o] = angular.copy(scope.changeClear.resetTo);
                            });
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
                        } else {
                            scope.$apply(() => ngModel.$setViewValue(val));
                        }
                    });

                    ngModel.$render = function () {
                        if (valueProperty) {
                            if (Array.isArray(ngModel.$viewValue))
                                scope.setValue(element, scope.type, ngModel.$viewValue.map(function (e) { return e[valueProperty]; }), displayString);
                            else
                                scope.setValue(element, scope.type, ngModel.$viewValue[valueProperty], displayString);
                        }
                        else
                            scope.setValue(element, scope.type, ngModel.$viewValue, displayString);
                    };

                    // HACK: Screw Select2 , it is so random
                    if (ngModel.$viewValue) {
                        scope.setValue(element, scope.type, ngModel.$viewValue, displayString);
                    }
                });
            }
        };
    });
