/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
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
angular.module("santedb").controller("PasswordController", ['$scope', '$rootScope', '$state', '$templateCache', '$stateParams', function ($scope, $rootScope, $state, $templateCache, $stateParams) {


    /**
     * Clear any server side errors
     */
    $scope.clearServerErrors = function (inputControl) {

        if (inputControl.$error)
            Object.keys(inputControl.$error).forEach((k) => {
                if (k.startsWith("err.")) delete (inputControl.$error[k]);
            });
    }

    /**
     * @summary Perform the password reset function
     */
    $scope.doReset = async function (form) {
        if (form.$invalid) {
            return;
        }

        SanteDB.display.buttonWait("#passwordButton", true);
        try {
            if ($scope.password.entity.userName == $rootScope.session.username) {
                await SanteDB.authentication.passwordLoginAsync($scope.password.entity.userName, $scope.password.entity.existingPassword, undefined, true, undefined, undefined);
            }
            var result = await SanteDB.authentication.setPasswordAsync($scope.password.entity.id, $scope.password.entity.userName, $scope.password.entity.password);
            $scope.closeForm(form);
            toastr.success(SanteDB.locale.getString("ui.password.notification.success"));
            if ($scope.password.entity.userName == $rootScope.session.username) { // we are logged out - so we want to reauthenticate to start a new session
                await SanteDB.authentication.passwordLoginAsync($scope.password.entity.userName, $scope.password.entity.existingPassword, undefined, false, undefined, undefined);

            }
        }
        catch (e) {
            if (e.data && e.data.length > 0 && e.data[0].error_description)
                e.userMessage = e.data[0].error_description;
            else switch (e.message) {
                case "invalid_grant":
                    e.userMessage = 'error.login.invalidPassword';
                    break;
                default:
                    e.userMessage = e.message;
                    break;
            }
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#passwordButton", false);
        }

    }

    /**
     * @summary Cancels the form submission
     */
    $scope.closeForm = function (form) {
        SanteDB.display.buttonWait("#passwordButton", false);
        form.$setPristine();
        form.$setUntouched();
        $("#passwordModal").modal('hide');
    }

    /**
     * @summary Watch for password changes
     */
    $scope.$watch("password.entity.password", function (n, o) {
        if (n)
            $scope.strength = SanteDB.application.calculatePasswordStrength(n);
    });
}]);
