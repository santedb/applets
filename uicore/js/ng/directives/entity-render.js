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
 */

/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>

angular.module('santedb-lib')
    /**
     * @summary Directive for rendering a single entity
     */
    .directive('entityRender', ['$timeout', function ($timeout) {

        var alreadyFetching = [];

        async function fetchEntityAsync(entityId, fetchFn) {
            try {
                var entity = null;
                if(fetchFn) {
                    entity = await fetchFn(entityId);
                } else {
                    entity = await SanteDB.entity.getAsync(entityId, "min");
                }
                
                if (entity) {
                    var alreadyFetchingIdx = alreadyFetching.indexOf(entityId);
                    alreadyFetching.splice(alreadyFetchingIdx, 1);

                    // Propogate to all others
                    $timeout(() => {
                        angular.element(`div[data-eid='${entityId}']`).forEach(ele => {
                            ele.scope().entity = entity;
                        });
                    });
                }
            }
            catch(e) {
                console.warn(e);
            }
        }

        return {
            scope: {
                entity: '=',
                entityId: '='
            },
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: './org.santedb.uicore/directives/entityRender.html',
            controller: ['$scope', '$state', function ($scope, $state) {

                $scope.$watch("entity", function (n, o) {
                    if (n) {
                        var viewer = SanteDB.application.getResourceViewer(n.$type);
                        if (viewer) {
                            $scope.navEntity = function (eid) {
                                viewer($state, $scope.entityId);
                            }
                        }
                    }
                });
            }],
            link: function (scope, element, attrs) {

                if (scope.entity) {
                    scope.entityId = scope.entity.id;
                }
                else {
                    $(element).attr('data-eid', scope.entityId);
                    if (alreadyFetching.indexOf(scope.entityId) == -1) // we fetch
                    {
                        alreadyFetching.push(scope.entityId);
                        fetchEntityAsync(scope.entityId, scope.fetchFn);
                    }
                }

            }
        }
    }])