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
     * @summary Security policy instance editor
     * @memberof Angular
     * @method entityPolicyAdmin
     */
    .directive('entityPolicyAdmin', ['$timeout', '$compile', '$rootScope', function ($timeout, $compile, $rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/policyAdmin.html',
            scope: {
                securable: '=',
                policy: '='
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

                $scope.deletePolicy = function (oid, index) {
                    if (confirm(SanteDB.locale.getString("ui.action.delete.confirm"))) {
                        SanteDB.display.buttonWait("#delPolicy" + index, true);

                        SanteDB.resources.securityPolicy.findAsync({ oid: oid, _count: 1})
                            .then(function(pol) {
                                var resource = SanteDB.resources[$scope.securable.$type.toCamelCase()];
                                if (resource == null)
                                    return;
                                resource.removeAssociatedAsync($scope.securable.id, "policy", pol.resource[0].id)
                                    .then(function (d) {
                                        SanteDB.display.buttonWait("#delPolicy" + index, false);
                                        $scope.refresh();
                                    })
                                    .catch(function (e) {
                                        SanteDB.display.buttonWait("#delPolicy" + index, false);
                                        $rootScope.errorHandler(e);
                                    });
                            })
                            .catch(function (e) {
                                SanteDB.display.buttonWait("#delPolicy" + index, false);
                                $rootScope.errorHandler(e);
                            });
                        
                    }
                }

                // Mark grant as dirty
                $scope.updateGrant = function (oid, grant, index) {

                    SanteDB.display.buttonWait("#grant" + index, true);
                    SanteDB.resources.securityPolicy.findAsync({ oid: oid, _count: 1 })
                        .then(function (res) {
                            pol = res.resource[0];
                            pol.grant = grant;
                            pol.$type = 'SecurityPolicyInfo';

                            var resource = SanteDB.resources[$scope.securable.$type.toCamelCase()];
                            if (resource == null)
                                return;
                            resource.addAssociatedAsync($scope.securable.id, "policy", pol)
                                .then(function (d) {
                                    SanteDB.display.buttonWait("#grant" + index, false);
                                    $scope.refresh();
                                })
                                .catch(function (e) {
                                    SanteDB.display.buttonWait("#grant" + index, false);
                                    $rootScope.errorHandler(e);
                                });
                        }).catch(function (e) {
                            SanteDB.display.buttonWait("#grant" + index, false);
                            $rootScope.errorHandler(e);
                        });

                }

                // Add a a new policy to the group
                $scope.addPolicy = function () {

                    $scope.newPolicy.exec = 'adding';
                    SanteDB.resources.securityPolicy.getAsync($scope.newPolicy.id)
                        .then(function (pol) {
                            pol.$type = 'SecurityPolicyInfo';
                            pol.grant = 'Grant';
                            var resource = SanteDB.resources[$scope.securable.$type.toCamelCase()];
                            if (resource == null)
                                return;
                            resource.addAssociatedAsync($scope.securable.id, "policy", pol)
                                .then(function (d) {
                                    delete ($scope.newPolicy);
                                    $scope.$apply();
                                    $scope.refresh();
                                })
                                .catch(function (e) {
                                    delete ($scope.newPolicy);
                                    $scope.$apply();
                                    $rootScope.errorHandler(e);
                                });
                        })
                        .catch(function (e) {
                            delete ($scope.newPolicy);
                            $scope.$apply();
                            $rootScope.errorHandler(e);
                        });
                }
            }],
            link: function (scope, element, attrs) {


                var dt = $('table', element).DataTable({
                    lengthChange: false,
                    searching: true,
                    serverSide: true,
                    layout: {
                        topStart: 'buttons'
                    },
                    buttons: [
                    ],
                    columns: [
                        {
                            className: "indicator-container",
                            orderable: false,
                            render: function(d,t,r) {
                                return `<i class="fas fa-shield-alt" title="${ SanteDB.locale.getString(r.canOverride ? 'ui.model.securityPolicy.canOverride.true' : 'ui.model.securityPolicy.canOverride.false') }"></i>
                                <span class="indicator ${ r.canOverride ? 'text-warning' : 'text-success'}"><i class="fa fa-fw fa-circle"></i></span> 
                                ${r.name} <small>${r.oid}</small>`
                            }
                        },
                        {
                            orderable: false,
                            render: function(d, t, r, i) {
                                return `<div class="btn-group btn-group-toggle" id="grant${i.row}"><label class="btn btn-info ${ r.grant == 'Grant' ? 'active btn-primary' : ''}"><input
                                        type="radio" name="rdo${r.oid}" ng-click="updateGrant('${r.oid}', 'Grant', ${i.row})" value="Grant" /> <i
                                        class="fas fa-thumbs-up"></i> <span class="d-sm-none d-lg-inline">
                                        {{ 'ui.model.securityPolicyInstance.grant.Grant' | i18n }}</span></label>
                                        <label class="btn btn-info ${ r.grant == 'Deny' ? 'active btn-primary' : ''}"><input type="radio"
                                        name="rdo${r.oid}"  ng-click="updateGrant('${r.oid}', 'Deny', ${i.row})" value="Deny" /> <i class="fas fa-thumbs-down"></i>
                                        <span class="d-sm-none d-lg-inline">
                                        {{ 'ui.model.securityPolicyInstance.grant.Deny' | i18n }}</span></label>
                                        <label class="btn btn-info ${ r.grant == 'Elevate' ? 'active btn-primary' : ''}"><input
                                        type="radio" name="rdo${r.oid}"  ng-click="updateGrant('${r.oid}', 'Elevate', ${i.row})" value="Elevate" /> <i
                                        class="fas fa-arrow-circle-up"></i> <span class="d-sm-none d-lg-inline">
                                        {{ 'ui.model.securityPolicyInstance.grant.Elevate' | i18n }}</span></label>
                                        </div>`;
                            }
                        },
                        {
                            orderable: false,
                            render: function(d, t, r, i) {
                                return `<button class="btn btn-danger" type="button" id="delPolicy${i.row}" ng-click="deletePolicy('${r.oid}', ${i.row})"><i class="fas fa-times"></i> <span
                                class="d-sm-none d-lg-inline"> {{ 'ui.action.remove' | i18n }}</span></button>`;
                            }
                        }
                    ],
                    ajax: function (data, callback, settings) {

                        if(!scope.securable) { 
                            callback( { data: [], recordsFiltered: 0, recordsTotal: 0 } );
                            return;
                        }

                        var query = {};
                        if (data.search.value.length > 0)
                            query.name = `~${data.search.value}`;
                        
                        query["_count"] = data.length;
                        query["_offset"] = data.start;
                        query["_includeTotal"] = true;
                        SanteDB.resources[scope.securable.$type.toCamelCase()].findAssociatedAsync(scope.securable.id, 'policy', query)
                            .then(function (res) {
                                callback({
                                    data: res.resource.map(function (item) {
                                        return item;
                                    }),
                                    recordsTotal: undefined,
                                    recordsFiltered: res.totalResults || res.size
                                });
                            })
                            .catch(function (err) { $rootScope.errorHandler(err) });
                    },
                    createdRow: function (r, d, i) {
                        $compile(angular.element(r).contents())(scope);
                        scope.$digest()
                    },
                });


                scope.refresh = function() {
                    dt.ajax.reload();
                }

                scope.$watch("securable", function(n, o) {
                    if(n)
                        dt.ajax.reload();
                });
                // Bind buttons
                var bindButtons = function () {
                    // dt.buttons().container().appendTo($('.col-md-6:eq(1)', dt.table().container()));
                    if (dt.buttons().container().length == 0)
                        $timeout(bindButtons, 100);
                    else {
                        $("#addPolicy", element).appendTo($('.dt-buttons', dt.table().container()));
                    }

                    dt.buttons().container().parent().removeClass("col-md-auto").addClass("col-6");
                    dt.buttons().container().removeClass("flex-wrap").addClass("w-100");

                };
                bindButtons();

            }
        }
    }]);