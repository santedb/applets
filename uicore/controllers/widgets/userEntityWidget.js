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
 */
angular.module('santedb').controller('UserProfileWidgetController', ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {

    /**
     * Updates the user entity
     */
    $scope.update = async function (form) {

        if (form.$invalid) return; // don't process invalid form

        // Now post the changed update object 
        try {
            var submissionObject = angular.copy($scope.editObject);
            await prepareEntityForSubmission(submissionObject);

            submissionObject.securityUser = submissionObject.securityUser || $rootScope.session.user.id;
            // Find the preferred language
            submissionObject.language = submissionObject.language || [];
            if ($scope.editObject.preferredLanguage) {
                var personLanguage = new PersonLanguageCommunication({ isPreferred: true, languageCode: $scope.editObject.preferredLanguage.languageCode });
                if (!submissionObject.language.find(o => o.isPreferred)) {
                    submissionObject.language.push(personLanguage);
                }
            }
            if (submissionObject.id) {
                $scope.scopedObject = await SanteDB.resources.userEntity.updateAsync(submissionObject.id, submissionObject);
            }
            else {
                $scope.scopedObject = await SanteDB.resources.userEntity.insertAsync(submissionObject);
            }

            var refetch =  await SanteDB.resources.userEntity.getAsync($scope.scopedObject.id, "full"); // re-fetch the entity
            $timeout(() => {
                $scope.scopedObject = refetch;
            })
            toastr.success(SanteDB.locale.getString("ui.model.userEntity.saveSuccess"));
            form.$valid = true;
        }
        catch (e) {
            $rootScope.errorHandler(e);
            form.$valid = false;
        }
    }

}]).controller("UserSecurityWidgetController", ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {

    $scope.$watch("editObject.id", async function (n, o) {
        console.info(n);
        if (n && n != o && !o) {
            if ($scope.editObject.language) {
                $scope.editObject.preferredLanguage = $scope.editObject.language.find(o => o.isPreferred);
            }

            // Get challenges
            try {
                var isUpstreamUser = $rootScope.session.authType == 'OAUTH' || !$scope.scopedObject._localOnly;
                var tfaData = {}, challenges = {}, userChallenges = {};
                try {
                    tfaData = await SanteDB.authentication.getTfaModesAsync(isUpstreamUser);
                    challenges = await SanteDB.resources.securityChallenge.findAsync(null, null, isUpstreamUser);
                    userChallenges = await SanteDB.resources.securityUser.findAssociatedAsync($scope.editObject.securityUser, "challenge", null, null, isUpstreamUser);
                }
                catch (e) {
                    console.warn(e);
                }

                $timeout(() => {
                    $scope.editObject.isUpstreamUser = isUpstreamUser;
                    $scope.tfaMechanisms = tfaData.resource;
                    $scope.challenges = challenges.resource || [];
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

    $scope.unSelectedChallenges = function (additionalId) {
        if ($scope.challenges) {
            return $scope.challenges.filter(c => c.id == additionalId || !$scope.editObject.challenges.find(e => e.challenge == c.id || e.id == c.id));
        }
    }

    $scope.$watch("editObject.securityUserModel.twoFactorMechanism", async function (n, o) {
        if (n && n != o && $scope.tfaMechanisms) {
            var mechanism = $scope.tfaMechanisms.find(o => o.id == n);
            if (mechanism.setup) {
                try {
                    $("#setupTfaModal").modal({ backdrop: "static" });
                    var instructionDoc = await SanteDB.authentication.setupTfaSecretAsync(n, null, $scope.editObject.isUpstreamUser);
                    switch (instructionDoc.mime) {
                        case "image/png":
                            $("#tfaImageSetup").removeClass("d-none");
                            $("#tfaImageSetup").addClass("d-block");
                            $("#tfaTextSetup").addClass("d-none");
                            $("#tfaImageSetup").attr("src", `data:image/png;base64,${instructionDoc.text}`);
                            break;
                        case "text/plain":
                            $("#tfaImageSetup").addClass("d-none");
                            $("#tfaTextSetup").addClass("d-block");
                            $("#tfaTextSetup").removeClass("d-none");
                            $("#tfaTextSetup").html(SanteDB.locale.getString(instructionDoc.text));
                            break;
                    }
                    $timeout(() => {
                        $scope.tfaSetup = mechanism;
                    });
                }
                catch (e) {
                    $rootScope.errorHandler(e);
                    $("#setupTfaModal").modal('hide');
                    $timeout(() => delete ($scope.editObject.securityUserModel.twoFactorMechanism));
                }
            }
        }
    });


    $scope.completeTfaSetup = async function (tfaForm) {
        if (tfaForm.$invalid) return;

        try {
            var userSubmission = {
                $type: "SecurityUserInfo",
                entity: $scope.editObject.securityUserModel
            };

            SanteDB.display.buttonWait("#btnCompleteTfaSetup", true);
            await SanteDB.authentication.setupTfaSecretAsync($scope.tfaSetup.id, $scope.tfaSetup.code, $scope.editObject.isUpstreamUser);
            toastr.success(SanteDB.locale.getString("ui.tfa.setup.success"));
            var result = await SanteDB.resources.securityUser.updateAsync(userSubmission.entity.id, userSubmission);
            $("#setupTfaModal").modal('hide');
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnCompleteTfaSetup", false);
        }
    }
    /**
     * Update security user
     */
    $scope.updateSecurity = async function (userForm) {

        if (userForm.$invalid) return;
        else if ($scope.editObject.isUpstreamUser &&
            ($rootScope.session.authType != 'OAUTH' || !SanteDB.application.getOnlineState())) {
            alert(SanteDB.locale.getString('ui.model.securityUser._changesPremittedOnlineOnly'));
            return;
        }

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

}]).controller('UserEntityPreferencesController', ["$scope", "$timeout", "$rootScope", "$state", function ($scope, $timeout, $rootScope, $state) {

    $scope.$watch("scopedObject", async function (n, o) {
        if (n && !n._preferences) {
            $scope.scopedObject._preferences = n._preferences = {};
            if (n.extension && n.extension['http://santedb.org/extensions/core/userPreferences']) {
                $timeout(() => {
                    var prefExt = JSON.parse(atob(n.extension['http://santedb.org/extensions/core/userPreferences'][0]));
                    n._preferences.widgets = prefExt.widgets ? JSON.parse(prefExt.widgets) : null;
                    n._preferences.help = prefExt.help || 'default';
                    n._preferences.uimode = prefExt.uimode || 'light';
                });
            }
            else {
                var settings = await await SanteDB.configuration.getUserSettingsAsync();
                $timeout(() => {
                    var widgetPref = (settings.find(o=>o.key == "widgets") || {}).value;
                    n._preferences.widgets = widgetPref ? JSON.parse(widgetPref) : {};
                    n._preferences.help = (settings.find(o=>o.key == "help") || {}).value;
                    n._preferences.uimode = (settings.find(o=>o.key == "uimode") || {}).value;
                });
            }
        }
    });

    $scope.updateHelpInlineHelpPreference = async function () {
        try {
            await SanteDB.configuration.saveUserSettingsAsync(
                [
                    { "key": "help", "value": $scope.scopedObject._preferences.help }
                ]);
            location.reload();
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    $scope.updateUserInterfacePreference = async function () {
        try {
            await SanteDB.configuration.saveUserSettingsAsync(
                [
                    { "key": "uimode", "value": $scope.scopedObject._preferences.uimode }
                ]);
            location.reload();
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }
}]);

