/// <reference path="../../../core/js/santedb.js"/>
/*
 * Copyright 2015-2018 Mohawk College of Applied Arts and Technology
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
 * User: justin
 * Date: 2018-7-26
 */
angular.module("santedb").controller("LoginController", ['$scope', '$rootScope', '$state', '$templateCache', function ($scope, $rootScope, $state, $templateCache) {

    // Send login request and then call continue with for the authentication elevator
    $scope.doLogin = function (form) {
        if (form.$invalid)
            return;

        SanteDB.display.buttonWait("#loginButton", true);
        // Perform login then call the elevator's continue with function
        switch ($scope.login.grant_type) {
            case 'password':
            
                SanteDB.authentication.passwordLoginAsync($scope.login.userName, $scope.login.password, $scope.login.tfaSecret, $scope.login.noSession, $scope.login.scope)
                    .then(function (d) {
                        if($scope.login.onLogin)
                            $scope.login.onLogin(d);
                        else  {
                            $templateCache.removeAll();
                            $state.reload();
                        }

                        if(!$scope.login.noSession)
                            $rootScope.session = d;
                        SanteDB.display.buttonWait("#loginButton", false);
                        $("#loginModal").modal('hide');
                    })
                    .catch(function (e) {
                        $rootScope.errorHandler(e);
                        SanteDB.display.buttonWait("#loginButton", false);
                    });
                break;
            case 'pin':
                SanteDB.authentication.pinLoginAsync($scope.login.userName, $scope.login.password, $scope.login.tfaSecret, $scope.login.noSession, $scope.login.scope)
                    .then(function (d) {
                        if($scope.login.onLogin)
                            $scope.login.onLogin(d);
                        else  {
                            $templateCache.removeAll();
                            $state.reload();
                        }

                        if(!$scope.login.noSession)
                            $rootScope.session = d;
                        SanteDB.display.buttonWait("#loginButton", false);
                        $("#loginModal").modal('hide');
                    })
                    .catch(function (e) {
                        $rootScope.errorHandler(e);
                        SanteDB.display.buttonWait("#loginButton", false);
                    });
                break;
        }
    }
}]);