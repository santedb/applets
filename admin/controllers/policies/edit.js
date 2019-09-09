/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('EditPolicyController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", "$compile", '$timeout', function ($scope, $rootScope, $state, $templateCache, $stateParams, $compile, $timeout) {

    $scope.EntityClassKeys = EntityClassKeys;

    // Get the specified user
    if ($stateParams.id) {
        $scope.isLoading = true;
        SanteDB.resources.securityPolicy.getAsync($stateParams.id)
            .then(function (u) {
                $scope.isLoading = false;
                $scope.target = $scope.target || {};
                $scope.target.securityPolicy = u;
                $scope.target.securityPolicy.etag = u.etag;
                $scope.$apply();
            })
            .catch($rootScope.errorHandler);

    }
    else  // New policy
    {
        $scope.target = {
            securityPolicy: new SecurityPolicy({
                isPublic: true
            })
        };

        /**
         * @summary Watch for changes to the username if we're creating and warn of duplicates
         */
        $scope.$watch("target.securityPolicy.name", function (n, o) {
            if (n != o && n && n.length >= 3) {
                SanteDB.display.buttonWait("#policyNameCopyButton button", true, true);
                SanteDB.resources.securityPolicy.findAsync({ name: n, _count: 0 })
                    .then(function (r) {
                        SanteDB.display.buttonWait("#policyNameCopyButton button", false, true);
                        if (r.size > 0) // Alert error for duplicate
                            $scope.targetForm.policyname.$setValidity('duplicate', false);
                        else
                            $scope.targetForm.policyname.$setValidity('duplicate', true);

                        try { $scope.$apply(); }
                        catch (e) { }
                    })
                    .catch(function () {
                        SanteDB.display.buttonWait("#policyNameCopyButton button", false, true);
                    });
            }
        });

        /**
         * @summary Watch for changes to the username if we're creating and warn of duplicates
         */
        $scope.$watch("target.securityPolicy.oid", function (n, o) {
            if (n != o && n && n.length >= 3) {
                SanteDB.display.buttonWait("#policyOidCopyButton button", true, true);
                SanteDB.resources.securityPolicy.findAsync({ oid: n, _count: 0 })
                    .then(function (r) {
                        SanteDB.display.buttonWait("#policyOidCopyButton button", false, true);
                        if (r.size > 0) // Alert error for duplicate
                            $scope.targetForm.policyoid.$setValidity('duplicate', false);
                        else
                            $scope.targetForm.policyoid.$setValidity('duplicate', true);

                        try { $scope.$apply(); }
                        catch (e) { }
                    })
                    .catch(function () {
                        SanteDB.display.buttonWait("#policyOidCopyButton button", false, true);
                    });
            }
        });
    }

    /**
     * @summary Save the specified role
     */
    $scope.savePolicy = function (policyForm) {

        if (!policyForm.$valid) return;

        // Show wait state
        SanteDB.display.buttonWait("#savePolicyButton", true);

        // Success fn
        var successFn = function (r) {
            // Now save the user entity
            toastr.success(SanteDB.locale.getString("ui.admin.policy.saveConfirm"));
            SanteDB.display.buttonWait("#savePolicyButton", false);
            $state.transitionTo("santedb-admin.security.policies.index")
        };
        var errorFn = function (e) {
            SanteDB.display.buttonWait("#savePolicyButton", false);
            $rootScope.errorHandler(e);
        };

        // policy is already registered we are updating them 
        if ($scope.target.securityPolicy.id) {
            // Register the user first
            SanteDB.resources.securityPolicy.updateAsync($scope.target.securityPolicy.id, $scope.target.securityPolicy).then(successFn)
                .catch(errorFn);
        }
        else {
            // Register the user first
            SanteDB.resources.securityPolicy.insertAsync($scope.target.securityPolicy).then(successFn)
                .catch(errorFn);
        }
    }

    
    /**
     * @summary Reactivate Inactive User
     */
    $scope.reactivatePolicy = function() {
        if(!confirm(SanteDB.locale.getString("ui.admin.policy.reactivate.confirm")))
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
        SanteDB.display.buttonWait("#reactivatePolicyButton", true);
        SanteDB.resources.securityPolicy.patchAsync($stateParams.id, $scope.target.securityPolicy.etag, patch)
            .then(function(r) {
                $scope.target.securityPolicy.obsoletionTime = null;
                $scope.target.securityPolicy.obsoletedBy = null;
                SanteDB.display.buttonWait("#reactivatePolicyButton", false);
                $scope.$apply();
            })
            .catch(function(e) { 
                $rootScope.errorHandler(e); 
                SanteDB.display.buttonWait("#reactivatePolicyButton", false);
            });

    }

}]);