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
    .directive('conceptSelect', ['$rootScope', '$timeout', function ($rootScope, $timeout) {

        var loaded = {};

        return {
            restrict: 'E',
            replace: true,
            require: 'ngModel',
            templateUrl: './org.santedb.uicore/directives/conceptSelect.html',
            scope: {
                conceptSet: '<',
                addConcept: '=',
                excludeConcepts: '=',
                key: "<"
            },
            controller: ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {
            }],
            link: function (scope, element, attrs, ngModel) {

                var useShortestName = attrs["shortestName"];

                if (scope.excludeConcepts && !Array.isArray(scope.excludeConcepts))
                    scope.excludeConcepts = [scope.excludeConcepts];

                // Load concept set
                async function loadConceptSet(setName) {
                    try {
                        if (!loaded[setName]) {
                            loaded[setName] = { callme: [] };
                            
                            var setValues = (await SanteDB.resources.conceptSet.invokeOperationAsync(null, "expand", { "_mnemonic": setName })).resource;

                            // Now - is there an additional concept
                            if (scope.addConcept) {

                                if (!Array.isArray(scope.addConcept))
                                    scope.addConcept = [scope.addConcept];

                                await Promise.all(scope.addConcept.map(async function (o) {
                                    if (typeof (o) === "string")
                                        o = await SanteDB.resources.concept.getAsync(o);
                                    setValues.push(o);
                                }));
                            }

                            setValues = setValues.sort((a,b)=> a.mnemonic < b.mnemonic ? -1 : a.mnemonic > b.mnemonic ? 1 : 0);
                            if(scope.excludeConcepts) {
                                setValues = setValues.filter(o => scope.excludeConcepts.indexOf(o.id) === -1)
                            }

                            if(useShortestName) {
                                setValues.forEach(sv => sv.name.en = sv.name.en.sort((a,b) => a?.length < b?.length ? -1 : a?.length > b?.length ? 1 : 0));
                            }

                            $timeout(function() {
                                scope.setValues = setValues;
                                loaded[setName].callme.forEach((r) => r(scope.setValues));
                                loaded[setName] = scope.setValues;
                            });
                        }
                        else {
                            if (Array.isArray(loaded[setName])) // loaded already
                                scope.setValues = loaded[setName];
                            else // still loading
                                loaded[setName].callme.push((r) => scope.setValues = r);
                        }

                    }
                    catch (e) {
                        console.error(e);
                    }
                }

                loadConceptSet(scope.conceptSet);

                // Element has changed
                element.on('change', function (e) {
                    var val = $(element).val();

                    if(val === "") {
                        scope.$apply(() => ngModel.$setViewValue(null));
                    }
                    else if (scope.key)
                        scope.$apply(() => ngModel.$setViewValue(scope.setValues.find(o => o.id == val)[scope.key]));
                    else if (scope._complexValue)
                        scope.$apply(() => ngModel.$setViewValue(scope.setValues.find(o => o.id == val)));
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