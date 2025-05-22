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
    * @summary Reference term select
    * @memberof Angular
    */
    .directive('refTermSelect', ['$rootScope', '$timeout', function ($rootScope, $timeout) {

        var loaded = {};

        return {
            restrict: 'E',
            replace: true,
            require: 'ngModel',
            templateUrl: './org.santedb.uicore/directives/refTermSelect.html',
            scope: {
                codeSystemDomain: '=',
                codeSystemId: '=',
                codeSystemUrl: '=',
                excludeTerms: "<"
            },
            controller: ['$scope', '$timeout', function ($scope, $timeout) {
            }],
            link: function (scope, element, attrs, ngModel) {

                if (scope.excludeTerms && !Array.isArray(scope.excludeTerms))
                    scope.excludeTerms = [scope.excludeTerms];

                // Load code system
                async function loadCodeSystem(codeSystemName) {
                    try {
                        if (!loaded[codeSystemName]) {
                            loaded[codeSystemName] = { callme: [] };
                            
                            var query = {};
                            if(scope.codeSystemDomain) query = { 'codeSystem.authority' : scope.codeSystemDomain };
                            else if(scope.codeSystemUrl) query = { 'codeSystem.url' : scope.codeSystemUrl };
                            else if(scope.codeSystemId) query = { 'codeSystem' : scope.codeSystemId };
                            else return;

                            var terms = (await SanteDB.resources.referenceTerm.findAsync(query)).resource;
                            terms = terms.sort((a,b)=> a.mnemonic < b.mnemonic ? -1 : a.mnemonic > b.mnemonic ? 1 : 0);

                            loaded[codeSystemName].callme.forEach((r) => r(terms));
                            loaded[codeSystemName] = terms;

                            $timeout(() => scope.refTerms = terms);
                        }
                        else {
                            if (Array.isArray(loaded[codeSystemName])) // loaded already
                                $timeout(() => scope.refTerms = loaded[codeSystemName]);
                            else // still loading
                                loaded[codeSystemName].callme.push((r) => scope.refTerms = r);
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                }

                loadCodeSystem(scope.codeSystemDomain || scope.codeSystemUrl || scope.codeSystemId);

                // Element has changed
                element.on('change', function (e) {
                    var val = $(element).val();

                    if(val === "") {
                        scope.$apply(() => ngModel.$setViewValue(null));
                    }
                    else if (scope.key)
                        scope.$apply(() => ngModel.$setViewValue(scope.refTerms.find(o => o.id == val)[scope.key]));
                    else if (scope._complexValue)
                        scope.$apply(() => ngModel.$setViewValue(scope.refTerms.find(o => o.id == val)));
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