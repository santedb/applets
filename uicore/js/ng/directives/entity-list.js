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
 * Date: 2024-2-3
 */
angular.module('santedb-lib')


    /**
     * @method tagInput
     * @memberof Angular
     * @summary A responsive list of entities based on filtering and searches
     * @example Display a patient result list
     * 
     * <entity-list type="Patient" 
     *      default-query="{ }" // The default query/list for filtering the resource/operation/sub-resource
     *      no-actions="true|false" // True if no action bar is to be shon
     *      search-field="name_of_field_to_search" // Name of the field the search box should use
     *      upstream="true|false" // True if the data shoul dbe forced from upstream 
     *      operation="nameOfOperationToRetrieve" // Name of hte operation to execute if using an operation to fetch records
     *      operation-scope="identifierOfScopeForOperation" // The identifier of the sub-resource on which to execute the action
     *      sub-resource="nameOfSubResource" // If querying from a sub-resource the name of the sub-resource
     *      sub-resource-scope="identifierForSubResource" // The identifier of the holder of the sub resource 
     *      key-property="" // The property for the key (used for sref and click callbacks)
     *      stateless="true|false"
     *      display="list|grid" // List -> One item per row, Grid -> Between one and three items per row (depending on width of screen)
    *       item-supplement="functionName" // The function which should be called for each record to supplement information in the display
     *      actions="[
     *          {  
     *              name: "",  // Name of the action
     *              action: functionRef,  // The function to execute when clicked
     *              sref: "name-of-state",  // The state to navigate to when clicked
     *              className: "",  // The name of the class for the button
     *              demand: "",  // The permission policy required to show the button
     *              icon: "fas fa-"  // The icon of the button
     *          }   
     *      ]"
     *      item-actions="[ // Actions for each record
     *          { 
     *              name: "",  // Name of the action
     *              action: functionRef,  // The function to execute when clicked
     *              sref: "name-of-state",  // The name of the state to navigate to when clicked
     *              className: "",  // The name of the class for the button
     *              demand: "",  // The permission/policy required to show the button
     *              icon: "fas fa-",  // The icon for the button
     *              label: "", // Explicit label for the action
     *              when: "r.xxxx == true"  // A guard condition for showing hte button where rec is passed as the current object
     *          }
     *      ]">
     *  <!-- PUT YOUR ITEM TEMPLATE FOR EACH ITEM HERE - item IS THE OBJECT REFERENCE FOR EXAMPLE -->
     *      <h5 class="item-list-title">{{ item.Name || name }}</h5>
     * </entity-list>
     *      
     * 
     */
    .directive("entityList", ["$compile", "$timeout", function ($compile, $timeout) {

        var _type = undefined,
            _noActions = undefined,
            _keyProperty = undefined,
            _orderBy = undefined,
            _itemTemplate = undefined,
            _listTemplate = undefined,
            _sourceApi = undefined,
            _scid = undefined,
            _queryId = undefined,
            _id = undefined,
            _operation = undefined,
            _subResource = undefined,
            _throttleGuard = 0;

        async function refreshItems(scope, filter) {
            var waiterDiv = $(`#${_id}_${_scid}`);
            try {
                waiterDiv.removeClass('d-none');
                var query = angular.copy(scope.defaultQuery) || {};

                // Are we currently on another page? Or has the user changed the count/limit
                query._count = scope.queryControl.resultsPerPage;
                query._offset = (scope.queryControl.currentPage - 1) * scope.queryControl.resultsPerPage;
                query._includeTotal = true;
                query._queryId = _queryId;

                // Is there a search term?
                if (scope.queryControl.filter && scope.queryControl.filter !== "") {
                    query[scope.searchField] = `~${scope.queryControl.filter}`;
                }
                if (_orderBy) {
                    query._orderBy = _orderBy;
                }

                var results = null;
                if (_operation) {
                    results = await _sourceApi.invokeOperationAsync(scope.operationScope, _operation, query, scope.upstream == true);
                } else if (_subResource) {
                    results = await _sourceApi.findAssociatedAsync(scope.subResourceScope, _subResource, query, full, scope.upstream == true);
                }
                else {
                    results = await _sourceApi.findAsync(query, 'full', scope.upstream == true);
                }

                if (Array.isArray(scope.itemSupplement)) {
                    results.resource = await Promise.all(results.resource.map(async res => {
                        for (var supl in scope.itemSupplement) {
                            res = await scope.itemSupplement[s](res);
                        }
                        return res;
                    }));
                }

                // Build the HTML for the scope
                $timeout(() => {
                    scope.results = results;
                    scope.queryControl._maxPages = Math.ceil(results.totalResults / scope.queryControl.resultsPerPage);
                    _throttleGuard = 0;

                    // If the first page then we show up to 5
                    scope.queryControl._paginationVals = [];

                    if (scope.queryControl._maxPages > 0) {
                        for (var i = scope.queryControl.currentPage - 1; i < scope.queryControl.currentPage + 2; i++) {
                            if (i > 1 && i < scope.queryControl._maxPages) {
                                scope.queryControl._paginationVals.push(i);
                            }
                        }
                    }
                });
            }
            catch (e) {
                console.error(e);
                alert(e.message || e);
            }
            finally {
                waiterDiv.addClass('d-none');
            }
        }


        return {
            scope: {
                defaultQuery: '=',
                upstream: '=',
                searchField: '=',
                actions: '<',
                itemActions: '<',
                operationScope: '=',
                subResourceScope: '=',
                itemSupplement: '<'
            },
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: '/org.santedb.uicore/directives/entityList.html',
            controller: ['$scope', "$state", function ($scope, $state) {

                $scope.$watch("queryControl.filter", function (n, o) {
                    if (n != o) {
                        if (_queryId !== undefined) {
                            _queryId = SanteDB.application.newGuid();
                        }
                        $scope.queryControl.currentPage = 1;

                        if (!_throttleGuard) // throttle requests to the server
                        {
                            _throttleGuard = 1;
                            refreshItems($scope);
                        }
                        else if (_throttleGuard == 1) {
                            _throttleGuard = 2;
                            $timeout(() => {
                                if (!_throttleGuard) {
                                    refreshItems($scope);
                                }
                            }, 1000)
                        }
                    }
                });

                $scope.$watch("queryControl.currentPage", function (n, o) {
                    if (n && o && n != o) {
                        refreshItems($scope);
                    }
                });

                $scope.$watch("queryControl.resultsPerPage", function (n, o) {
                    if (n && o && n != o) {
                        refreshItems($scope);
                    }
                });

                $scope.$watch("upstream", function (n, o) {
                    if (n && o && n != o) {
                        refreshItems($scope);
                    }
                });

                $scope.filterAction = function (action, record) {
                    if (action.when) {
                        return $scope.$eval(action.when, { r: record });
                    }
                    else {
                        return true;
                    }
                };

                $scope.doAction = function (action, record) {
                    if (action.sref) {
                        if (record) {
                            $state.go(action.sref, { id: record[_keyProperty] });
                        }
                        else {
                            $state.go(action.sref);
                        }
                    }
                    else if (typeof (action.action) === "string") {
                        if (record) {
                            $scope.$parent[action.action](record[_keyProperty], record);
                        }
                        else {
                            $scope.$parent[action.action]();
                        }
                    }
                    else if (action.action) {
                        if (record) {
                            action.action(record[_keyProperty], record);
                        }
                        else {
                            action.action();
                        }
                    }
                }

            }],
            link: function (scope, element, attrs) {
                _type = attrs.type;
                _noActions = attrs.noActions;
                scope._display = attrs.display || 'list';

                _keyProperty = attrs.keyProperty || 'id';
                _orderBy = attrs.orderBy || 'creationTime:asc';
                _operaation = attrs.operation;
                _subResource = attrs.subResource;
                _id = attrs.id;
                _scid = scope.scid = SanteDB.application.newGuid().substring(0, 8);
                _sourceApi = SanteDB.resources[_type.toCamelCase()];
                _itemTemplate = $("div[ng-transclude]", element).html();
                _listTemplate = $("#listTemplate", element).html().replaceAll(" xg-", " ng-").replace("$template", _itemTemplate).replace("$itemClass", attrs.itemClass);
                $("#listContainer", element).html(_listTemplate);
                $compile(angular.element("#listContainer"))(scope);
                console.info(_listTemplate);
                $(".entity-list-waiter", element).attr("id", `${_id}_${_scid}`);

                if (attrs.canChangeView == "true") {
                    $(".viewChange", element).removeClass("d-none");
                }
                if (attrs.canSize == "true") {
                    $(".resultSize", element).removeClass("d-none");
                }
                if(attrs.canFilter == "true") {
                    $(".filter", element).removeClass("d-none");
                }

                scope.queryControl = {
                    currentPage: 1,
                    filter: null,
                    resultsPerPage: scope.display == 'list' ? 5 : 9,
                }

                if (attrs.stateless !== "true") {
                    _queryId = SanteDB.application.newGuid();
                }

                if (!_type) { throw "@type required on entity-list"; }
                else if (!_sourceApi) { throw `No SanteDB API exists for ${_type}`; }
                else if (!_itemTemplate) { throw "entity-list missing item template"; }

                refreshItems(scope);

            }
        }
    }]);
