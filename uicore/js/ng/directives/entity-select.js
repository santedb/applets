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
    * @summary Cocnept input drop down
    * @memberof Angular
    */
    .directive('entitySelect', ['$rootScope', '$timeout', function ($rootScope, $timeout) {

        var loaded = {};

        return {
            restrict: 'E',
            replace: true,
            require: 'ngModel',
            templateUrl: './org.santedb.uicore/directives/entitySelect.html',
            scope: {
                entityType: '<',
                filter: '<',
                excludeEntities: '=',
                key: "<",
                autoSelectSingles: "<",
                itemSupplement: "<",
                returnObject: "<"
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {
            }],
            link: function (scope, element, attrs, ngModel) {

                if (scope.excludeEntities && !Array.isArray(scope.excludeEntities))
                    scope.excludeEntities = [scope.excludeEntities];

                scope.render = function(i) {
                    if(attrs.display) {
                        return scope.$eval(attrs.display, { item: i });
                    }
                    else {
                        return SanteDB.display.renderEntityName(i.name);
                    }
                }
                
                // Load Entities
                async function loadEntities(entityType, filter) {
                    try {
                        var api = SanteDB.resources[entityType.toCamelCase()];
                        if(api == null) {
                            throw "Invalid entity type " + entityType;
                        }
                        filter._count = 30;
                        filter._includeTotal = false;
                        var results = await api.findAsync(filter, attrs.viewModel || "fastview");

                        // are there any item supplements
                        if(scope.itemSupplement) {
                            results.resource = await Promise.all(results.resource.map(async (item) => {
                                for(var i in scope.itemSupplement) {
                                    item = await scope.itemSupplement[i](item);
                                }
                                return item;
                            }))
                        };
                        
                        $timeout(() => {
                            if(!ngModel.$viewValue && scope.autoSelectSingles && results.resource?.length == 1) {
                                if(scope.key) {
                                    ngModel.$setViewValue(results.resource[0][scope.key]);
                                }
                                else if(scope.returnObject) {
                                    ngModel.$setViewValue(results.resource[0]);
                                }
                                else {
                                    ngModel.$setViewValue(results.resource[0].id);
                                }
                            } 
                            scope.values = results.resource;
                        });
                    }
                    catch (e) {
                        console.error(e);
                    }
                }

                loadEntities(scope.entityType, scope.filter || {});

                scope.$watch((s) => JSON.stringify(s.filter), function(n, o) {
                    if(n != o && n) {
                        loadEntities(scope.entityType, scope.filter);
                    }
                });

                
                // Element has changed
                element.on('change', function (e) {
                    var val = $(element).val();
                    var modelValue = null;
                    if(val === "") {
                        scope.$apply(() => ngModel.$setViewValue(null));
                    }
                    else if (scope.key) {
                        modelValue = scope.values.find(o => o.id == val);
                        scope.$apply(() => ngModel.$setViewValue(modelValue[scope.key]));
                    }
                    else if (scope._complexValue || scope.returnObject) {
                        modelValue = scope.values.find(o => o.id == val);
                        scope.$apply(() => ngModel.$setViewValue(modelValue));
                    }
                    else 
                        scope.$apply(() => ngModel.$setViewValue(val));

                });
                ngModel.$render = function () {
                    if (ngModel.$viewValue) {

                        var value = ngModel.$viewValue;

                        if(Array.isArray(value)) {
                            value = value[0];
                        }

                        // is there a key? 
                        var valueKey = value;
                        if(value.id) {
                            scope._complexValue = true;
                            valueKey = value.id;
                        }
                        if (scope.key) {
                            scope._complexValue = true;
                            valueKey = value[scope.key];
                        }
                        $(element).val(valueKey);
                    }
                    else
                        $(element).val(null);
                };
            }
        }
    }]);