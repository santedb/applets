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
    .directive('entityTable', ['$timeout', '$compile', '$rootScope', '$state', function ($timeout, $compile, $rootScope, $state) {
        
        return {
            scope: {
                properties: "<",
                external: "<",
                defaultQuery: "=",
                itemActions: "<",
                actions: "<",
                render: "<",
                i18nPrefix: "<",
                multiSelect: "<",
                sort: "<",
                defaultFilter: "<",
                canFilter: "<",
                canSize: "<",
                noButtons: "<",
                buttonBar: "<",
                itemClass: "<"
            },
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: './org.santedb.uicore/directives/entityTable.html',
            controller: ['$scope', '$rootScope',
                function ($scope, $rootScope) {
                }
            ],
            link: function (scope, element, attrs, ngModel) {

                var lastQuery = "";
                var queryId = null;
                var isSearching = false; // true if a search is being performed
                var returnTimer = null;

                $timeout(function () {

                    scope.propertyPath = attrs.propertyPath;

                    var columns = scope.properties.map(function (m) {
                        var renderer = scope.render ? scope.render[m] : null;

                        return {
                            orderable: renderer == null || scope.sort && scope.sort[m] !== undefined,
                            data: m,
                            class: scope.itemClass ? scope.itemClass[m] : null,
                            defaultContent: '',
                            render: renderer ?
                                function (d, t, r) { 
                                    if(typeof(renderer) == "function")
                                        return renderer(r);
                                    else if(typeof(scope.$parent[renderer]) === "function")
                                        return scope.$parent[renderer](r);
                                    else 
                                        return `<span class='alert alert-danger'><i class='fas fa-bug'></i> ${renderer} not a function</span>`;
                                 } :
                                m.indexOf("Time") > -1 ?
                                    function (d, t, r) {
                                        return d ? moment(d).format(SanteDB.locale.dateFormats.second) :
                                            null;
                                    } : null
                        };
                    });

                    // Add ID
                    columns.unshift({ data: "id", visible: false });

                    // Add buttons 
                    if (scope.itemActions && scope.itemActions.length > 0) {
                        columns.push({
                            orderable: false,
                            render: function (d, t, r, m) {
                                var retVal = `<div class='btn-group' id='action_grp_${m.row}'>`;
                                scope.itemActions.forEach(function (b) {

                                    if (!b.when || scope.$eval(b.when, { r: r, cell: m, StatusKeys: StatusKeys})) {
                                        if (b.sref)
                                            retVal += `<a title="${SanteDB.locale.getString('ui.action.' + b.name)}" ui-sref="${b.sref}({ id: '${r.id}' })" class="btn ${(b.className || 'btn-default')}">`;
                                        else
                                            retVal += `<a title="${SanteDB.locale.getString('ui.action.' + b.name)}" href="" ng-click="$parent.${b.action}('${r.id}', ${m.row})" class="btn ${(b.className || 'btn-default')}">`;
                                        retVal += `<i class="${b.icon || 'fas fas-eye-open'}"></i>&nbsp;`;

                                        if (b.name)
                                            retVal += `<span class="d-sm-none d-lg-inline">${SanteDB.locale.getString(b.label || 'ui.action.' + b.name)}</span>`;
                                        retVal += "</a>";
                                    }
                                });
                                return retVal + "</div>";
                            }
                        })
                    }

                    // Buttons
                    var buttons = [];
                    
                    if(scope.buttonBar) 
                        buttons = [ 'copy' ];
                    else if(scope.noButtons)
                        buttons = [];
                    else {
                        buttons = (scope.actions || []).map(function (b) {
                            return {
                                text: `<i class="${b.icon}"></i> ` + SanteDB.locale.getString('ui.action.' + b.name),
                                className: `btn ${b.className || 'btn-default'}`,
                                action: function (e, dt, node, config) {
                                    $state.transitionTo(b.sref);
                                }
                            }
                        });

                        // Add refresh button
                        buttons.push(
                        'reload'
                        );

                        // Add a show obsolete button
                        if(scope.defaultQuery && scope.defaultQuery.obsoletionTime)
                            buttons.push({
                                text: "<i class='fas fa-trash'></i> " + SanteDB.locale.getString("ui.action.showDeleted"),
                                className: "btn btn-light",
                                action: function (e, dt, node, config) {
                                    
                                    var btn = $("button.btn-light:has(i.fa-trash)", element);
                                    if(btn.hasClass("active")) { // active to inactive
                                        scope.defaultQuery.obsoletionTime = 'null';
                                        $("button.btn-light:has(i.fa-trash)", element).removeClass("active");
                                    }
                                    else {
                                        scope.defaultQuery.obsoletionTime = '!null';
                                        $("button.btn-light:has(i.fa-trash)", element).addClass("active");
                                    }
                                    
                                    dt.ajax.reload();
                                    
                                }
                            });
                        else if(scope.defaultQuery && scope.defaultQuery.statusConcept)
                            buttons.push({
                                text: "<i class='fas fa-trash'></i> " + SanteDB.locale.getString("ui.action.showDeleted"),
                                className: "btn btn-light",
                                action: function (e, dt, node, config) {
                                    if (!scope.defaultQuery.statusConcept || scope.defaultQuery.statusConcept == StatusKeys.Active) {
                                        scope.defaultQuery.statusConcept = '!' + StatusKeys.Active;
                                        $("button.btn-light:has(i.fa-trash)", element).addClass("active");
                                    }
                                    else {
                                        scope.defaultQuery.statusConcept = StatusKeys.Active;
                                        $("button.btn-light:has(i.fa-trash)", element).removeClass("active");
                                    }
                                    dt.ajax.reload();
                                }
                            });
                    }
                    
                    // Default is true
                    if(scope.canFilter === undefined)
                        scope.canFilter = true;
                    
                    var dt = $("table", element).DataTable({
                        lengthChange: scope.canSize,
                        processing: true,
                        buttons: buttons,
                        serverSide: true,
                        searching: scope.canFilter,
                        "oSearch": scope.defaultFilter ? {"sSearch": scope.defaultFilter} : undefined,
                        ajax: function (data, callback, settings) {

                            
                            var query = angular.copy(scope.defaultQuery) || {};
                            if(data.search.value) {
                                if (data.search.value.length > 0)
                                    query[attrs.searchField] = `~${data.search.value}`;
                            }
                            if (data.order[0].column != 0) {
                                var orderExpr = colname = scope.properties[data.order[0].column - 1]; // -1 because the ID column is hidden
                                if(scope.sort && scope.sort[colname])
                                    orderExpr = scope.sort[colname];

                                query["_orderBy"] = `${orderExpr}:${data.order[0].dir}`;
                            }
                            if (scope.extenral)
                                query["_upstream"] = true;

                            var thisQuery = JSON.stringify(query);
                            if (lastQuery != thisQuery || element.attr("newQuery") == "true") {
                                lastQuery = thisQuery;
                                queryId = SanteDB.application.newGuid();
                                element.attr("newQuery", false);
                            }

                            query["_queryId"] = queryId;
                            query["_count"] = data.length;
                            query["_offset"] = data.start;

                            if(!query._noexec) {
                                
                                // Set a timeout for 1s and then re-check 
                                if(isSearching)
                                {
                                    if(!returnTimer)
                                        returnTimer = setTimeout(() => dt.ajax.reload(), 1000);
                                }
                                else {
                                    if(returnTimer) clearTimeout(returnTimer); // cancel the previous timer
                                    isSearching = true;
                                    SanteDB.resources[attrs.type.toCamelCase()].findAsync(query)
                                        .then(function (res) {

                                            res.resource = res.resource || [];
                                            callback({
                                                data: res.resource.map(function (item) {
                                                    if (scope.propertyPath)
                                                        return item[scope.propertyPath];
                                                    else
                                                        return item;
                                                }),
                                                recordsTotal: res.totalResults || res.size || 0,
                                                recordsFiltered: res.totalResults || res.size || 0,
                                                iTotalRecords: res.totalResults || res.size || 0,
                                                iTotalDisplayRecords: res.totalResults  || res.size  || 0
                                            });
                                            isSearching = false;
                                        })
                                        .catch(function (err) { 
                                            isSearching = false;
                                            $rootScope.errorHandler(err);
                                        });
                                }
                            }
                            else {
                                callback({ 
                                    data: [],
                                    recordsTotal: 0,
                                    recordsFiltered: 0,
                                    iTotalRecords: 0,
                                    iTotalDisplayRecords: 0
                                });
                            }
                        },
                        createdRow: function (r, d, i) {
                            $compile(angular.element(r).contents())(scope);
                            scope.$digest()
                        },
                        columns: columns
                    });

                    var buttonSelector = '.col-md-6:eq(0)';
                    var bindButtons = function (element, buttonBar) {
                        dt.buttons().container().appendTo($(buttonSelector, dt.table().container()));
                        if (dt.buttons().container().length == 0) {
                            $timeout(() => bindButtons(element, buttonBar), 100);
                        } else if(buttonBar) {
                            $(buttonBar).appendTo($(buttonSelector, dt.table().container()));
                        }

                        if(!scope.canFilter)  {
                            $(buttonSelector, dt.table().container()).removeClass("col-md-6").addClass("col-md-12");
                            buttonSelector = '.col-md-12:eq(0)';
                        }

                    };

                    // Add watch to scope query
                    scope.$watch((s)=>JSON.stringify(s.defaultQuery), function(n,o) { if(n && n != o) dt.ajax.reload() });
                    bindButtons(element, scope.buttonBar);
                });
            }
        };
    }]);