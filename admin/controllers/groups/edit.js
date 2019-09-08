/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('EditGroupController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", "$compile", '$timeout', function ($scope, $rootScope, $state, $templateCache, $stateParams, $compile, $timeout) {

    $scope.EntityClassKeys = EntityClassKeys;
    
    

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
                            $scope.targetForm.name.$setValidity('duplicate', false);
                        else
                            $scope.targetForm.name.$setValidity('duplicate', true);

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
    $scope.reactivateGroup = function() {
        if(!confirm(SanteDB.locale.getString("ui.admin.group.reactivate.confirm")))
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
            .then(function(r) {
                $scope.target.securityRole.obsoletionTime = null;
                $scope.target.securityRole.obsoletedBy = null;
                SanteDB.display.buttonWait("#reactivateRoleButton", false);
                $scope.$apply();
            })
            .catch(function(e) { 
                $rootScope.errorHandler(e); 
                SanteDB.display.buttonWait("#reactivateRoleButton", false);
            });

    }

    /**
     * @summary Save the specified role
     */
    $scope.saveRole = function(roleForm) {

        if(!roleForm.$valid) return;

        // Show wait state
        SanteDB.display.buttonWait("#saveGroupButton", true);

        // Success fn
        var successFn = function(r) { 
            // Now save the user entity
            toastr.success(SanteDB.locale.getString("ui.admin.groups.saveConfirm"));
            SanteDB.display.buttonWait("#saveGroupButton", false);
            $state.transitionTo("santedb-admin.security.groups.index");
        };
        var errorFn = function(e) {
            SanteDB.display.buttonWait("#saveGroupButton", false);
            $rootScope.errorHandler(e);
        };

        // user is already registered we are updating them 
        if($scope.target.securityRole.id)
        {
            // Register the user first
            SanteDB.resources.securityRole.updateAsync($scope.target.securityRole.id, {
                $type: "SecurityRoleInfo",
                policy: $scope.target.policy,
                entity: $scope.target.securityRole
            }).then(successFn)
            .catch(errorFn);
        }
        else {
            // Register the user first
            SanteDB.resources.securityRole.insertAsync({
                $type: "SecurityRoleInfo",
                policy: $scope.target.policy,
                entity: $scope.target.securityRole
            }).then(successFn)
            .catch(errorFn);
        }
    }

    // Now create datatables
    var dt = $("#groupMembershipTable").DataTable({
        lengthChange: false,
        processing: true,
        buttons: [
        ],
        serverSide: true,
        ajax: function (data, callback, settings) {

            var query = { "roles.id" : $stateParams.id };
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
                        data: res.item.map(function(item) { return item.entity; }),
                        recordsTotal: undefined,
                        recordsFiltered: res.totalResults || res.size
                    });
                })
                .catch(function (err) { $rootScope.errorHandler(err) });
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
                render: function(d, t, r, m) {
                    return "";
                }
            }
        ]
    });

     // Bind buttons
     var bindButtons = function () {
        dt.buttons().container().appendTo($('.col-md-6:eq(1)', dt.table().container()));
        if (dt.buttons().container().length == 0)
            $timeout(bindButtons, 100);
        else {
            $("#addUserToGroup").appendTo($('.col-md-6:eq(0)', dt.table().container()));
        }
    };
    bindButtons();
}]);