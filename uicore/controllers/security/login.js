/// <reference path="../../../core/js/santedb.js"/>
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
angular.module("santedb").controller("LoginController", ['$scope', '$rootScope', '$state', '$templateCache', '$stateParams', function ($scope, $rootScope, $state, $templateCache, $stateParams) {


    // Send login request and then call continue with for the authentication elevator
    $scope.doLogin = function (form) {
        if (form.$invalid)
            return;

        SanteDB.display.buttonWait("#loginButton", true);
        // Perform login then call the elevator's continue with function
        switch ($scope.login.grant_type) {
            case 'password':

                var pouKey = $scope.login.purposeOfUse ? $scope.login.purposeOfUse.id : null;
                SanteDB.authentication.passwordLoginAsync($scope.login.userName, $scope.login.password, $scope.login.tfaSecret, $scope.login.noSession, pouKey, $scope.login.scope)
                    .then(function (d) {

                        if ($scope.login.onLogin) {
                            $scope.login.onLogin(d);
                        }
                        else {

                            if (!$scope.login.noSession) {
                                $templateCache.removeAll();
                                $rootScope.session = d;
                            }

                            if ($stateParams.returnState && $stateParams.returnState != "login")
                                $state.transitionTo($stateParams.returnState);
                            else
                                window.location.hash = "#!/";
                        }

                        SanteDB.display.buttonWait("#loginButton", false);
                        $("#loginModal").modal('hide');
                    })
                    .catch(function (e) {
                        if (e.data && e.data.length > 0 && e.data[0].error_description) {
                            e.userMessage = e.data[0].error_description;
                        }
                        else
                            switch (e.message) {
                                case "invalid_grant":
                                    e.userMessage = 'error.login.invalidPassword';
                                    break;
                                default:
                                    e.userMessage = e.message;
                                    break;
                            }
                        $rootScope.errorHandler(e);
                        SanteDB.display.buttonWait("#loginButton", false);
                    });
                break;
            case 'pin':
                SanteDB.authentication.pinLoginAsync($scope.login.userName, $scope.login.password, $scope.login.tfaSecret, $scope.login.noSession, $scope.login.scope)
                    .then(function (d) {
                        if ($scope.login.onLogin) {
                            $scope.login.onLogin(d);
                        }
                        else {

                            if (!$scope.login.noSession) {
                                $templateCache.removeAll();
                                $rootScope.session = d;
                            }

                            if ($stateParams.returnState && $stateParams.returnState != "login")
                                $state.transitionTo($stateParams.returnState);
                            else
                                window.location.hash = "#!/";
                        }

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

    // Establish a client session
    async function establishClientSession() {
        // Set the elevator to the application elevator

        var session = await SanteDB.authentication.clientCredentialLoginAsync(true, ["1.3.6.1.4.1.33349.3.1.5.9.2.1.0.1"]);
        var elevator = {
            getToken: function () { return session.access_token; },
            elevate: function() {}
        }
        SanteDB.authentication.setElevator(elevator);
    }

    $rootScope.$watch("system.serviceState.ami", function(n, o) {
        if(n && $scope.reset && $scope.reset.user && !$scope.reset.challenge) 
            $scope.setResetUser();
    });

    // Set the reset stage
    $scope.setResetUser = async function () {

        // Get the user information
        try {
            SanteDB.display.buttonWait("#setUserButton", true);
            await establishClientSession();
            var user = await SanteDB.resources.securityUser.findAsync({ userName: $scope.reset.username });

            if(!user.resource || user.resource.length == 0) 
                user = await SanteDB.resources.securityUser.findAsync({ userName: $scope.reset.username, _upstream: true });

            if(!user.resource || user.resource.length == 0) 
                throw new Exception("ResetPasswordException", "ui.login.resetPassword.noUser");
            
            $scope.reset.user = user.resource[0].entity;
            $scope.reset.onlineOnly = user.resource[0].role.find(o=>o == "LOCAL_USERS") == null;
            var challenge = await SanteDB.resources.securityUser.findAssociatedAsync($scope.reset.user.id, "challenge");
            if(!challenge.resource || challenge.resource.length == 0) 
                throw new Exception("ResetPasswordException", "ui.login.resetPassword.noUser");

            $scope.reset.challenge = challenge.resource[0]
            try {
                $scope.$apply();
            }
            catch(e) {}
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.authentication.setElevator(null);
            SanteDB.display.buttonWait("#setUserButton", false);

        }

    }

    // Challenge login
    $scope.challengeLogin = async function() {
        try {
            SanteDB.display.buttonWait("#verifyChallengeButton", true);
            var session = await SanteDB.authentication.challengeLoginAsync($scope.reset.username, $scope.reset.challenge.id, $scope.reset.challengeResponse, null);
            SanteDB.authentication.setElevator({ getToken: function() { return session.access_token; }});
            $scope.reset.challengeResponse = "XXXX";
            $scope.reset.password = {};
            
            $scope.$watch("reset.password.password", function (n, o) {
                if(n) 
                    $scope.strength = SanteDB.application.calculatePasswordStrength(n);
            });
            try {
                $scope.$apply();
            }
            catch(e) {}
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#verifyChallengeButton", false);
        }
    }

    // Perform the actual reset
    $scope.resetPassword = async function(form) {

        if(!form.$valid) return;

        try {
            SanteDB.display.buttonWait("#submitButton", true);
            await SanteDB.authentication.setPasswordAsync($scope.reset.user.id, $scope.reset.username, $scope.reset.password.password);
            toastr.success(SanteDB.locale.getString("ui.login.resetPassword.success"));
            $scope.cancelReset(form);
        }
        catch(e) {
            if(e.$type == "DetectedIssueException") {// Error with password
                form.newPassword.$error = {};
                e.rules.filter(function(d) { return d.priority == "Error"; }).forEach(function(d) {
                    form.newPassword.$error[d.id] = true;
                });
                $scope.$apply();
            }
            else 
                $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#submitButton", false);

        }
    }
    // Cancel reset
    $scope.cancelReset = function(form) {
        SanteDB.authentication.setElevator(null);
        form.$setPristine();
        form.$setUntouched();
        $("#forgotPasswordModal").modal("hide");
        delete($scope.reset);
    }
}]);