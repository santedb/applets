/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('EditGroupController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {

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
}]);