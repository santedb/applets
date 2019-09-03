/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
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
angular.module("santedb").controller("PasswordController", ['$scope', '$rootScope', '$state', '$templateCache', '$stateParams', function ($scope, $rootScope, $state, $templateCache, $stateParams) {


    /**
     * @summary Perform the password reset function
     */
    $scope.doReset = function (form) {
        if (form.$invalid) {
            return;
        }

        // Reset password function
        var resetFn = function() {
            SanteDB.authentication.setPasswordAsync($scope.password.entity.id, $scope.password.entity.userName, $scope.password.entity.password)
                .then(function(result) {
                    $scope.closeForm(form);
                    toastr.success(SanteDB.locale.getString("ui.password.notification.success"));

                })
                .catch(function(e) {
                    SanteDB.display.buttonWait("#passwordButton", false);
                    if(e.$type == "DetectedIssueException") {// Error with password
                        form.newPassword.$error = {};
                        e.rules.filter(function(d) { return d.priority == "Error"; }).forEach(function(d) {
                            form.newPassword.$error[d.text] = true;
                        });
                        $scope.$apply();
                    }
                    else 
                        $rootScope.errorHandler(e);
                })
        }

        SanteDB.display.buttonWait("#passwordButton", true);
        // First we should authenticate ourselves to reset the password if we're resetting our own
        if($scope.password.entity.userName == $rootScope.session.username) {
            // Verify current password
            SanteDB.authentication.passwordLoginAsync($scope.password.entity.userName, $scope.password.entity.existingPassword, undefined, true, undefined, undefined)
                .then(function(session) {
                    resetFn();
                })
                .catch(function(e) {
                    SanteDB.display.buttonWait("#passwordButton", false);
                    if(e.data && e.data.length > 0 && e.data[0].error_description) 
                        e.userMessage = e.data[0].error_description;
                    else 
                        e.userMessage = e.message;
                    $rootScope.errorHandler(e);
                });
        }
        else 
            resetFn();
    }

    /**
     * @summary Cancels the form submission
     */
    $scope.closeForm = function(form) {
        SanteDB.display.buttonWait("#passwordButton", false);
        form.$setPristine();
        form.$setUntouched();
        $("#passwordModal").modal('hide');
    }

    /**
     * @summary Watch for password changes
     */
    $scope.$watch("password.entity.password", function (n, o) {
        if(n) 
            $scope.strength = SanteDB.application.calculatePasswordStrength(n);
    });
}]);
