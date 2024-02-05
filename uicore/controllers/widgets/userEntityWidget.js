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
angular.module('santedb').controller('CoreUserWidgetController', ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {



    $scope.$watch("scopedObject", async function (n, o) {
        if (n) {
            if (n.language) {
                n.preferredLanguage = n.language.find(o => o.isPreferred);
            }

            var editObject = angular.copy(n);
            var tfaData = await SanteDB.authentication.getTfaModesAsync();

            // Get challenges
            try {
                var challenges = await SanteDB.resources.securityChallenge.findAsync();
                var userChallenges = await SanteDB.resources.securityUser.findAssociatedAsync(n.securityUser, "challenge");

                $timeout(() => {
                    $scope.tfaMechanisms = tfaData.resource;
                    $scope.editObject = editObject;
                    $scope.challenges = challenges.resource;
                    if (userChallenges.resource && userChallenges.resource.length > 0)
                        $scope.editObject.challenges = userChallenges.resource.map(function (i) { i.challenge = i.id, i.response = "XXXXXXX"; i.configured = true; return i; });
                    else
                        $scope.editObject.challenges = [];
                    while ($scope.editObject.challenges.length < 3)
                        $scope.editObject.challenges.push({ challenge: null });

                });

            }
            catch (e) {
                console.warn(e);
            }
        }
    });


    /**
     * Updates the user entity
     */
    $scope.update = async function (form) {

        if (form.$invalid) return; // don't process invalid form



        // Now post the changed update object 
        try {
            var submissionObject = angular.copy($scope.editObject);
            await prepareEntityForSubmission(submissionObject);
            if (submissionObject.id) {
                $scope.scopedObject = await SanteDB.resources.userEntity.updateAsync(submissionObject.id, submissionObject);
            }
            else {
                $scope.scopedObject = await SanteDB.resources.userEntity.insertAsync(submissionObject);
            }

            $scope.scopedObject = await SanteDB.resources.userEntity.getAsync($scope.scopedObject.id, "full"); // re-fetch the entity
            toastr.success(SanteDB.locale.getString("ui.model.userEntity.saveSuccess"));
            form.$valid = true;
            $scope.$apply();
        }
        catch (e) {
            $rootScope.errorHandler(e);
            form.$valid = false;
        }
    }

    /**
     * Update security user
     */
    $scope.updateSecurity = async function (userForm) {

        if (userForm.$invalid) return;

        // Set roles
        try {
            var userSubmission = {
                $type: "SecurityUserInfo",
                entity: $scope.editObject.securityUserModel
            };

            var result = await SanteDB.resources.securityUser.updateAsync(userSubmission.entity.id, userSubmission);
            // Now it is time to set the security challenges if they are set
            if ($scope.editObject.challenges) {


                var setSecurityFn = async function () {
                    try {
                        // Set the elevator as the user will need to set their p
                        await Promise.all($scope.editObject.challenges
                            .filter(o => !o.configured && o.response) // Not pre-configured values
                            .map(async function (o) {
                                if (o.challenge && o.challenge != o.id)
                                    await SanteDB.resources.securityUser.removeAssociatedAsync(userSubmission.entity.id, "challenge", o.challenge, true);
                                await SanteDB.resources.securityUser.addAssociatedAsync(userSubmission.entity.id, "challenge", {
                                    $type: "SecurityUserChallengeInfo",
                                    challenge: o.id,
                                    response: o.response
                                }, true);
                            }));

                        SanteDB.authentication.setElevator(null);
                        toastr.success(SanteDB.locale.getString("ui.admin.users.saveConfirm"));

                    }
                    catch (e) {
                        $rootScope.errorHandler(e);
                    }
                }

                var pou = await SanteDB.resources.concept.getAsync("8b18c8ce-916a-11ea-bb37-0242ac130002");
                SanteDB.authentication.setElevator(new SanteDBElevator(setSecurityFn, pou));
                await setSecurityFn();
            }

            result = await SanteDB.resources.securityUser.getAsync(result.entity.id);
            $scope.scopedObject.securityUserModel = result.entity;
            toastr.success(SanteDB.locale.getString("ui.admin.users.saveConfirm"));
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveUserButton", false);
        }
    }

    /**
     * @summary Reset password for the current
     */
    $scope.resetPassword = function () {
        // Show wait
        SanteDB.display.buttonWait("#resetPasswordButton", true);

        // Setup password change request
        $scope.password = {
            id: $scope.scopedObject.securityUserModel.id,
            entity: {
                userName: $scope.scopedObject.securityUserModel.userName,
                id: $scope.scopedObject.securityUserModel.id,
                password: null
            },
            passwordOnly: true
        };
        $("#passwordModal").modal({ backdrop: 'static' });

        // User has pressed save or cancelled
        $("#passwordModal").on('hidden.bs.modal', function () {
            $scope.password = null;
            SanteDB.display.buttonWait("#resetPasswordButton", false);
        });

    }
}]);