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
               conceptModel: '=',
               key: "<"
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

                    if(scope.key)
                        scope.$apply(() => ngModel.$setViewValue(scope.setValues.find(o=>o.id == val)[scope.key]));
                    else 
                        scope.$apply(() => ngModel.$setViewValue(scope.setValues.find(o=>o.id == val)));
                });
                ngModel.$render = function () {
                    if(ngModel.$viewValue) {
                        // is there a key? 
                        var value = ngModel.$viewValue.id;
                        if(scope.key) 
                            value = ngModel.$viewValue[scope.key];
                        $(element).val(value);
                    }
                    else 
                        $(element).val(null);
                };

                // HACK: Screw Select2 , it is so random
                //if(ngModel.$viewValue)
                //    scope.setValue(element, modelType, ngModel.$viewValue);

           }
       }
   }]);