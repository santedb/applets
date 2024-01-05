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
     * @summary Directive for rendering a table of entities
     */
    .directive('objectTree', ['$timeout', '$compile', '$rootScope', '$state', function ($timeout, $compile, $rootScope, $state) {

        return {
            scope: {
                object: "<",
                scoper: "<",
                depth: "<"
            },
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: './org.santedb.uicore/directives/objectTree.html',
            controller: ['$scope', '$rootScope',
                function ($scope, $rootScope) {
                    $scope.isExpandible = (val) => angular.isObject(val) && $scope.depth < 5;
                }
            ],
            link: function (scope, element, attrs, ngModel) {
                scope.depth = scope.depth || 0;
                if(scope.object.$type) {

                    Object.keys(scope.object).forEach(k => {
                        if(scope.object[k].$type == "Concept") {
                            scope.object[k] = {
                                $type:"Concept",
                                mnemonic: scope.object[k].mnemonic,
                                id: scope.object[k].id,
                                name: scope.object[k].name
                            };
                        }
                    })
                    
                }

            }
        }
    }])