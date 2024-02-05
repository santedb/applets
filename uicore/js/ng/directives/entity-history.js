/*
 * Copyright (C) 2021 - 2024, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
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
 * 
 * User: fyfej
 * Date: 2023-5-19
 */

/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>

angular.module('santedb-lib')
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
    });