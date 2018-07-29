/// <reference path="../../../core/js/santedb.js"/>
angular.module("santedb").controller("LoginController", ['$scope', '$rootScope', function ($scope, $rootScope) {

    // Send login request and then call continue with for the authentication elevator
    $scope.doLogin = function (form) {
        if (form.$invalid)
            return;

        SanteDB.display.buttonWait("#loginButton", true);
        // Perform login then call the elevator's continue with function
        switch ($scope.login.grant_type) {
            case 'password':
                SanteDB.authentication.passwordLoginAsync($scope.login.userName, $scope.login.password, $scope.login.tfaSecret, true)
                    .then(function (d) {
                        $scope.login.onLogin(d);
                        SanteDB.display.buttonWait("#loginButton", false);
                    })
                    .catch(function (e) {
                        $rootScope.errorHandler(e);
                        SanteDB.display.buttonWait("#loginButton", false);
                    });
                break;
            case 'pin':
                SanteDB.authentication.pinLoginAsync($scope.login.userName, $scope.login.password, $scope.login.tfaSecret, true)
                    .then(function (d) {
                        $scope.login.onLogin(d);
                        SanteDB.display.buttonWait("#loginButton", false);
                    })
                    .catch(function (e) {
                        $rootScope.errorHandler(e);
                        SanteDB.display.buttonWait("#loginButton", false);
                    });
                break;
        }
    }
}]);