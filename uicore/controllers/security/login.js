/// <reference path="../../../core/js/santedb.js"/>
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
 * 
 * User: fyfej
 * Date: 2023-5-19
 */
angular.module("santedb").controller("LoginController", ['$scope', '$rootScope', '$state', '$templateCache', '$stateParams', '$timeout', function ($scope, $rootScope, $state, $templateCache, $stateParams, $timeout) {


    // Send login request and then call continue with for the authentication elevator
    $scope.doLogin = async function (form) {
        if (form.$invalid)
            return;

        SanteDB.display.buttonWait("#loginButton", true);
        try {

            var pouKey = $scope.login.purposeOfUse ? $scope.login.purposeOfUse.id : null;
            var sessionResult = null;
            switch ($scope.login.grant_type) {
                case "password":
                    sessionResult = await SanteDB.authentication.passwordLoginAsync($scope.login.userName, $scope.login.password, $scope.login.tfaSecret, $scope.login.noSession, pouKey, $scope.login.scope);
                    break;
                case "pin":
                    sessionResult = await SanteDB.authentication.pinLoginAsync($scope.login.userName, $scope.login.password, $scope.login.tfaSecret, $scope.login.noSession, $scope.login.scope);
                    break;
                default:
                    throw { "message": "ui.login.invalidMethod" };
            }

            if ($scope.login.onLogin) {
                $scope.login.onLogin(sessionResult);
            }
            else {
                if (!$scope.login.noSession) {
                    $templateCache.removeAll();
                    $rootScope.session = sessionResult;
                }

                if ($stateParams.returnState && $stateParams.returnState != "login")
                    $state.go($stateParams.returnState);
                else
                    window.location.hash = "#!/";
            }

            $("#loginModal").modal('hide');
        }
        catch (e) {

            if (e.data.error === "mfa_required") {
                $timeout(() => {
                     
                     $scope.login.requireTfa =
                     $scope.login._lockPassword = 
                     $scope.login._lockUserName = true;
                    $scope.login._mfaDetail = e.data.error_description;
                });
                return;
            }
            else if (e.data && e.data.error_description) {
                e.userMessage = e.data.error_description;
                e.expiry = new Date(new Date().getTime() + e.data.expires_in);
            }
            else {
                e.userMessage = e.message;
            }
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#loginButton", false);
        }
    }

    // Establish a client session
    async function establishClientSession() {
        // Set the elevator to the application elevator

        var session = await SanteDB.authentication.clientCredentialLoginAsync(true, ["1.3.6.1.4.1.33349.3.1.5.9.2.1.0.1"]);
        var elevator = {
            getToken: function () { return session.access_token; },
            elevate: function () { }
        }
        SanteDB.authentication.setElevator(elevator);
    }

    $rootScope.$watch("system.serviceState.ami", function (n, o) {
        if (n && $scope.reset && $scope.reset.user && !$scope.reset.challenge)
            $scope.setResetUser();
    });

    // Set the reset stage
    $scope.setResetUser = async function () {

        // Get the user information
        try {
            SanteDB.display.buttonWait("#setUserButton", true);
            var resetChallenge = null;
            try { // try local - we can't query because we have no session so let the server reject
                resetChallenge = await SanteDB.authentication.initiateChallengeFlowAsync($scope.reset.username);
            } catch(e) {
                resetChallenge = await SanteDB.authentication.initiateChallengeFlowAsync($scope.reset.username, true);
            }
            $timeout(_ => {
                $scope.reset.challenge = SanteDB.convertFromParameters(resetChallenge);
            }); 
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
    $scope.challengeLogin = async function () {
        try {
            SanteDB.display.buttonWait("#verifyChallengeButton", true);
            var session = await SanteDB.authentication.challengeLoginAsync($scope.reset.username, $scope.reset.challenge.challenge, $scope.reset.challengeResponse, null);
            SanteDB.authentication.setElevator({ getToken: function () { return session.access_token; } });

            $scope.$watch("reset.password.password", function (n, o) {
                if (n)
                    $scope.strength = SanteDB.application.calculatePasswordStrength(n);
            });

            $timeout (_ => {
                $scope.reset.challengeResponse = "XXXX";
                $scope.reset.password = {};
                $scope.reset.user = SanteDB.authentication.parseJwt(session.id_token);

                
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#verifyChallengeButton", false);
        }
    }

    // Perform the actual reset
    $scope.resetPassword = async function (form) {

        if (!form.$valid) return;

        try {
            SanteDB.display.buttonWait("#submitButton", true);
            var sid = $scope.reset.user["urn:santedb:org:claim:usrid"];
            if(!sid) {
                sid = $scope.reset.user.sub[0];
            }

            await SanteDB.authentication.setPasswordAsync(sid, $scope.reset.username, $scope.reset.password.password, $scope.reset.user.realm !== undefined);
            toastr.success(SanteDB.locale.getString("ui.login.resetPassword.success"));
            $scope.cancelReset(form);
        }
        catch (e) {
            if (e.$type == "DetectedIssueException") {// Error with password
                form.newPassword.$error = {};
                e.rules.filter(function (d) { return d.priority == "Error"; }).forEach(function (d) {
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
    $scope.cancelReset = function (form) {
        SanteDB.authentication.setElevator(null);
        form.$setPristine();
        form.$setUntouched();
        $("#forgotPasswordModal").modal("hide");
        delete ($scope.reset);
    }
}]);