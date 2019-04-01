/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('EditUserController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {

    $scope.EntityClassKeys = EntityClassKeys;
    
    // Get the specified user
    if ($stateParams.id) {
        $scope.isLoading = true;
        SanteDB.resources.securityUser.getAsync($stateParams.id)
            .then(function (u) {
                $scope.isLoading = !$scope.target;
                $scope.target = $scope.target || {};
                $scope.target.role = u.role;
                $scope.target.securityUser = u.entity;
                $scope.target.securityUser.etag = u.etag;
                $scope.$apply();
            })
            .catch($rootScope.errorHandler);

        // Get the related user entity at the same time
        SanteDB.resources.userEntity.findAsync({ securityUser: $stateParams.id })
            .then(function (u) {
                $scope.isLoading = !$scope.target;
                $scope.target = $scope.target || {};

                if (u.item && u.item.length > 0)
                    $scope.target.entity = u.item[0];
                else
                    $scope.target.entity = new UserEntity();

                $scope.$apply();
            })
            .catch($rootScope.errorHandler);
    }
    else  // New user
    {
        $scope.target = {
            securityUser: new SecurityUser(),
            entity: new UserEntity(),
            roles: []
        };

        /**
         * @summary Watch for changes to the username if we're creating and warn of duplicates
         */
        $scope.$watch("target.securityUser.userName", function (n, o) {
            if (n && n.length > 3) {
                SanteDB.display.buttonWait("#usernameCopyButton button", true, true);
                SanteDB.resources.securityUser.findAsync({ userName: n })
                    .then(function (r) {
                        SanteDB.display.buttonWait("#usernameCopyButton button", false, true);
                        if (r.item.length > 0) // Alert error for duplicate
                            $scope.targetForm.username.$setValidity('duplicate', false);
                        else
                            $scope.targetForm.username.$setValidity('duplicate', true);

                        try { $scope.$apply(); }
                        catch (e) { }
                    })
                    .catch(function () {
                        SanteDB.display.buttonWait("#usernameCopyButton button", false, true);
                    });
            }
        });
    }


    /**
     * @summary Reset password for the current
     */
    $scope.resetPassword = function () {
        // Show wait
        SanteDB.display.buttonWait("#resetPasswordButton", true);

        // Setup password change request
        $scope.password = {
            id: $scope.target.securityUser.id,
            entity: {
                userName: $scope.target.securityUser.userName,
                id: $scope.target.securityUser.id,
                password: null
            },
            passwordOnly : true
        };
        $("#passwordModal").modal({ backdrop: 'static' });

        // User has pressed save or cancelled
        $("#passwordModal").on('hidden.bs.modal', function () {
            $scope.password = null;
            SanteDB.display.buttonWait("#resetPasswordButton", false);
        });

    }

    /**
     * @summary Reactivate Inactive User
     */
    $scope.reactivateUser = function() {
        if(!confirm(SanteDB.locale.getString("ui.admin.users.reactivate.confirm")))
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
        SanteDB.display.buttonWait("#reactivateUserButton", true);
        SanteDB.resources.securityUser.patchAsync($stateParams.id, $scope.target.securityUser.etag, patch)
            .then(function(r) {
                $scope.target.securityUser.obsoletionTime = null;
                $scope.target.securityUser.obsoletedBy = null;
                SanteDB.display.buttonWait("#reactivateUserButton", false);
                $scope.$apply();
            })
            .catch(function(e) { 
                $rootScope.errorHandler(e); 
                SanteDB.display.buttonWait("#reactivateUserButton", false);
            });

    }

    /**
     * @summary Reset invalid logins
     */
    $scope.resetInvalidLogins = function() {
        if(!confirm(SanteDB.locale.getString("ui.admin.users.invalidLogin.reset")))
            return;

        var patch = new Patch({
            change: [
                new PatchOperation({
                    op: PatchOperationType.Replace,
                    path: "invalidLoginAttempts",
                    value: 0
                })
            ]
        });

        SanteDB.display.buttonWait("#resetInvalidLoginButton", true);
        SanteDB.resources.securityUser.patchAsync($stateParams.id, $scope.target.securityUser.etag, patch)
            .then(function(r) {
                SanteDB.display.buttonWait("#resetInvalidLoginButton", false);
                $scope.target.securityUser.invalidLoginAttempts = 0;
                $scope.$apply();
            })
            .catch(function(e) {
                $rootScope.errorHandler(e);
                SanteDB.display.buttonWait("#resetInvalidLoginButton", false);
            })
    }

     /**
     * @summary Unlock user
     */
    $scope.unlock = function() {
        if(!confirm(SanteDB.locale.getString("ui.admin.users.confirmUnlock")))
            return;

        SanteDB.display.buttonWait("#unlockButton", true);
        SanteDB.resources.securityUser.unLockAsync($stateParams.id)
            .then(function(r) {
                SanteDB.display.buttonWait("#unlockButton", false);
                $scope.target.securityUser.lockout = null;
                $scope.$apply();
            })
            .catch(function(e) {
                $rootScope.errorHandler(e);
                SanteDB.display.buttonWait("#unlockButton", false);
            })
    }

     /**
     * @summary Watch for password changes
     */
    $scope.$watch("target.securityUser.password", function (n, o) {
        if(n) 
            $scope.strength = SanteDB.application.calculatePasswordStrength(n);
    })
}]);