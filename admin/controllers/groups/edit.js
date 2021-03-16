/// <reference path="../../../core/js/santedb.js"/>
/*
 * Portions Copyright 2015-2019 Mohawk College of Applied Arts and Technology
 * Portions Copyright 2019-2019 SanteSuite Contributors (See NOTICE)
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
 * Date: 2019-9-5
 */
angular.module('santedb').controller('EditGroupController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", "$compile", '$timeout', function ($scope, $rootScope, $state, $templateCache, $stateParams, $compile, $timeout) {

    $scope.EntityClassKeys = EntityClassKeys;

    var membersTable = null;


    // Get the specified user
    if ($stateParams.id) {
        $scope.isLoading = true;
        SanteDB.resources.securityRole.getAsync($stateParams.id)
            .then(function (u) {
                $scope.isLoading = false;
                $scope.target = $scope.target || {};
                $scope.target.policy = u.policy;
                $scope.target.securityRole = u.entity;
                $scope.target.securityRole.etag = u.etag;

                $scope.$apply();
            })
            .catch($rootScope.errorHandler);

    }
    else  // New user
    {
        $scope.target = {
            securityRole: new SecurityRole(),
            policy: []
        };

        /**
         * @summary Watch for changes to the username if we're creating and warn of duplicates
         */
        $scope.$watch("target.securityRole.name", function (n, o) {
            if (n != o && n && n.length >= 3) {
                SanteDB.display.buttonWait("#roleNameCopyButton button", true, true);
                SanteDB.resources.securityRole.findAsync({ name: n, _count: 0 })
                    .then(function (r) {
                        SanteDB.display.buttonWait("#roleNameCopyButton button", false, true);
                        if (r.size > 0) // Alert error for duplicate
                            $scope.targetForm.rolename.$setValidity('duplicate', false);
                        else
                            $scope.targetForm.rolename.$setValidity('duplicate', true);

                        try { $scope.$apply(); }
                        catch (e) { }
                    })
                    .catch(function () {
                        SanteDB.display.buttonWait("#roleNameCopyButton button", false, true);
                    });
            }
        });
    }



    /**
     * @summary Reactivate Inactive Group
     */
    $scope.reactivateGroup = function () {
        if (!confirm(SanteDB.locale.getString("ui.admin.group.reactivate.confirm")))
            return;

        var patch = new Patch({
            change: [
                new PatchOperation({
                    op: PatchOperationType.Remove,
                    path: 'obsoletionTime',
                    value: null
                }),
                new PatchOperation({
                    op: PatchOperationType.Remove,
                    path: 'obsoletedBy',
                    value: null
                })
            ]
        });

        // Send the patch
        SanteDB.display.buttonWait("#reactivateRoleButton", true);
        SanteDB.resources.securityRole.patchAsync($stateParams.id, $scope.target.securityRole.etag, patch)
            .then(function (r) {
                $scope.target.securityRole.obsoletionTime = null;
                $scope.target.securityRole.obsoletedBy = null;
                SanteDB.display.buttonWait("#reactivateRoleButton", false);
                $scope.$apply();
            })
            .catch(function (e) {
                $rootScope.errorHandler(e);
                SanteDB.display.buttonWait("#reactivateRoleButton", false);
            });

    }

    /**
     * @summary Save the specified role
     */
    $scope.saveGroup = function (roleForm) {

        if (!roleForm.$valid) return;

        // Show wait state
        SanteDB.display.buttonWait("#saveGroupButton", true);

        // Success fn
        var successFn = function (r) {
            // Now save the user entity
            toastr.success(SanteDB.locale.getString("ui.model.securityRole.saveSuccess"));
            SanteDB.display.buttonWait("#saveGroupButton", false);
            $state.transitionTo("santedb-admin.security.groups.edit", { "id": r.entity.id })
        };
        var errorFn = function (e) {
            SanteDB.display.buttonWait("#saveGroupButton", false);
            $rootScope.errorHandler(e);
        };

        // user is already registered we are updating them 
        if ($scope.target.securityRole.id) {
            // Register the user first
            SanteDB.resources.securityRole.updateAsync($scope.target.securityRole.id, {
                $type: "SecurityRoleInfo",
                entity: $scope.target.securityRole
            }).then(successFn)
                .catch(errorFn);
        }
        else {
            // Register the user first
            SanteDB.resources.securityRole.insertAsync({
                $type: "SecurityRoleInfo",
                entity: $scope.target.securityRole
            }).then(successFn)
                .catch(errorFn);
        }
    }

    /**
     * @summary Add the newUser object to the group
     */
    $scope.addUser = function () {
        console.log(`Add user`)
        // Add new user
        $scope.newUser.exec = true;
        $scope.newUser.$type = 'SecurityUser';
        SanteDB.resources.securityRole.addAssociatedAsync($scope.target.securityRole.id, 'user', $scope.newUser)
            .then(function (d) {
                delete ($scope.newUser);

                membersTable.ajax.reload();
            })
            .catch(function (e) {
                delete ($scope.newUser);
                $rootScope.errorHandler(e);
            })
    }

    /**
     * @summary Remove the specified user
     */
    $scope.deleteUser = function (uid) {
        console.log(`Delete User`)
        if (confirm(SanteDB.locale.getString("ui.admin.securityRole.removeUserConfirm"))) {
            SanteDB.resources.securityRole.removeAssociatedAsync($scope.target.securityRole.id, 'user', uid)
                .then(function (d) {
                    membersTable.ajax.reload();
                })
                .catch($rootScope.errorHandler);
        }
    }

    // Now create datatables
    $scope.$watch('target.securityRole', function (n, o) {

        if (n) {

            if (membersTable instanceof $.fn.dataTable.Api) {
                console.log(`Init`)
            } else {
                console.log(`Init`)
            }
            
            membersTable  = $("#groupMembershipTable").DataTable({
                lengthChange: false,
                processing: true,     
                retrieve: true,        
                buttons: [
                ],
                serverSide: true,
                ajax: function (data, callback, settings) {

                    var query = { "roles.id": $stateParams.id };
                    if (data.search.value.length > 0)
                        query["userName"] = `~${data.search.value}`;
                    if (data.order[0]) {
                        query["_orderBy"] = `userName:${data.order[0].dir}`;
                    }

                    query["_count"] = data.length;
                    query["_offset"] = data.start;

                    SanteDB.resources.securityUser.findAsync(query)
                        .then(function (res) {
                            callback({
                                data: res.resource.map(function (item) { return item.entity; }),
                                recordsTotal: undefined,
                                recordsFiltered: res.totalResults || res.size
                            });
                        })
                        .catch(function (err) { 
                            console.log(`ERROR ERROR ERROR`)
                            $rootScope.errorHandler(err) 
                        });
                },
                createdRow: function (r, d, i) {
                    $compile(angular.element(r).contents())($scope);
                    $scope.$digest()
                },
                columns: [
                    {
                        data: 'userName',
                        defaultValue: ''
                    },
                    {
                        orderable: false,
                        render: function (d, t, r, m) {
                            return `<button ng-click="deleteUser('${r.id}')" class="btn btn-danger" id="delUsr-${r.id}"><i class="fas fa-times"></i><span class="d-sm-none d-lg-inline"> ${SanteDB.locale.getString("ui.action.remove")}</span></button>`;
                        }
                    }
                ]
            });

            // Bind buttons
            var bindButtons = function () {
                membersTable.buttons().container().appendTo($('.col-md-6:eq(1)', membersTable.table().container()));
                if (membersTable.buttons().container().length == 0)
                    $timeout(bindButtons, 100);
                else {
                    $("#addUserToGroup").appendTo($('.col-md-6:eq(0)', membersTable.table().container()));
                }
            };
            bindButtons();
        }

    });
}]);