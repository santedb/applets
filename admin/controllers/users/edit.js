/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('EditUserController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {

    // Get the specified user
    if ($stateParams.id) {
        $scope.isLoading = true;
        SanteDB.resources.securityUser.getAsync($stateParams.id)
            .then(function (u) {
                $scope.isLoading = !$scope.user;
                $scope.user = $scope.user || {};
                $scope.user.role = u.role;
                $scope.user.securityUser = u.entity;
                $scope.$apply();
            })
            .catch($rootScope.errorHandler);

        // Get the related user entity at the same time
        SanteDB.resources.userEntity.findAsync({ securityUser: $stateParams.id })
            .then(function (u) {
                $scope.isLoading = !$scope.user;
                $scope.user = $scope.user || {};

                if (u.item && u.item.length > 0)
                    $scope.user.entity = u.item[0];
                else
                    $scope.user.entity = new UserEntity();

                $scope.$apply();
            })
            .catch($rootScope.errorHandler);
    }
    else  // New user
    {
        $scope.user = {
            securityUser: new SecurityUser(),
            entity: new UserEntity(),
            roles: []
        };

        /**
         * @summary Watch for changes to the username if we're creating and warn of duplicates
         */
        $scope.$watch("user.securityUser.userName", function (n, o) {
            if (n && n.length > 3) {
                SanteDB.display.buttonWait("#usernameCopyButton button", true, true);
                SanteDB.resources.securityUser.findAsync({ userName: n })
                    .then(function (r) {
                        SanteDB.display.buttonWait("#usernameCopyButton button", false, true);
                        if (r.item.length > 0) // Alert error for duplicate
                            $scope.userForm.username.$setValidity('duplicate', false);
                        else
                            $scope.userForm.username.$setValidity('duplicate', true);

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
            id: $scope.user.securityUser.id,
            entity: {
                userName: $scope.user.securityUser.userName,
                id: $scope.user.securityUser.id,
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
}]);