/// <reference path="../../../core/js/santedb.js"/>
/*
 * Portions Copyright 2015-2019 Mohawk College of Applied Arts and Technology
 * Portions Copyright 2019-2019 SanteSuite Contributors (See NOTICE)
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
angular.module('santedb')
    .controller('EditUserController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {

        $scope.EntityClassKeys = EntityClassKeys;

        // Get the specified user
        if ($stateParams.id) {
            $scope.isLoading = true;
            SanteDB.resources.securityUser.getAsync($stateParams.id)
                .then(function (u) {
                    $scope.isLoading = !$scope.target;
                    $scope.target = $scope.target || {};
                    $scope.target.role = u.role;
                    $scope.target.entity = u.entity;
                    $scope.target.entity.etag = u.etag;
                    $scope.$apply();
                })
                .catch($rootScope.errorHandler);

            // Get the related user entity at the same time
            SanteDB.resources.userEntity.findAsync({ securityUser: $stateParams.id, _viewModel: "full" })
                .then(function (u) {
                    $scope.isLoading = !$scope.target;
                    $scope.target = $scope.target || {};

                    if (u.resource && u.resource.length > 0) {
                        $scope.target.userEntity = u.resource[0];
                    }
                    else
                        $scope.target.userEntity = new UserEntity({
                            language: [
                                {
                                    "languageCode": SanteDB.locale.getLanguage(),
                                    "isPreferred": true
                                }
                            ],
                            securityUser: $stateParams.id
                        });

                    // Set language
                    if (!$scope.target.userEntity.language)
                        $scope.target.preferredLanguage = SanteDB.locale.getLanguage();
                    else if (!Array.isArray($scope.target.userEntity.language))
                        $scope.target.preferredLanguage = $scope.target.userEntity.language.languageCode;
                    else {
                        var lng = $scope.target.userEntity.language.find(function (l) { return l.isPreferred; });
                        if (!lng)
                            lng = { "languageCode": SanteDB.locale.getLanguage() };
                        $scope.target.preferredLanguage = lng.languageCode;
                    }

                    $scope.$apply();
                })
                .catch($rootScope.errorHandler);
        }
        else  // New user
        {
            $scope.target = {
                entity: new SecurityUser(),
                userEntity: new UserEntity({
                    language: [
                        {
                            "languageCode": SanteDB.locale.getLanguage(),
                            "isPreferred": true
                        }
                    ]
                }),
                preferredLanguage: SanteDB.locale.getLanguage(),
                roles: []
            };

            /**
             * @summary Watch for changes to the username if we're creating and warn of duplicates
             */
            $scope.$watch("target.entity.userName", function (n, o) {
                if (n != o && n && n.length >= 3) {
                    SanteDB.display.buttonWait("#usernameCopyButton button", true, true);
                    SanteDB.resources.securityUser.findAsync({ userName: n, _count: 0 })
                        .then(function (r) {
                            SanteDB.display.buttonWait("#usernameCopyButton button", false, true);
                            if (r.size > 0) // Alert error for duplicate
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
        * @summary Save the specified user  (LEGACY)
        */
        $scope.saveUser = function (userForm) {

            if (!userForm.$valid) return;

            // First, copy telecoms over to the user entity
            $scope.target.userEntity.telecom = $scope.target.userEntity.telecom || {};
            $scope.target.userEntity.telecom.MobileContact = [];
            $scope.target.userEntity.telecom.WorkPlace = [];
            if ($scope.target.entity.phoneNumber)
                $scope.target.userEntity.telecom.MobileContact.push({ value: `tel://${$scope.target.entity.phoneNumber}` });
            if ($scope.target.entity.email)
                $scope.target.userEntity.telecom.WorkPlace.push({ value: `mailto:${$scope.target.entity.email}` });

            // Correct arrays and assign id
            if (!$scope.target.userEntity.id) {
                $scope.target.userEntity.id = SanteDB.application.newGuid();
            }

            // Set preferred language
            delete ($scope.target.userEntity.language);
            $scope.target.userEntity.language = {
                "isPreferred": true,
                "languageCode": $scope.target.preferredLanguage
            };

            
            // Show wait state
            SanteDB.display.buttonWait("#saveUserButton", true);

            // Success fn
            var successFn = function (r) {
                // Now save the user entity
                toastr.success(SanteDB.locale.getString("ui.model.securityUser.saveSuccess"));
                SanteDB.display.buttonWait("#saveUserButton", false);
                $state.transitionTo("santedb-admin.security.users.index");
            };
            var errorFn = function (e) {
                SanteDB.display.buttonWait("#saveUserButton", false);
                if (e.$type == "DetectedIssueException" && userForm.newPassword) { // Error with password?
                    userForm.newPassword.$error = {};
                    var passwdRules = e.rules.filter(function (d) { return d.priority == "Error" && d.text == "err.password.complexity"; });
                    if (passwdRules.length == e.rules.length) {
                        passwdRules.forEach(function (d) {
                            userForm.newPassword.$error[d.text] = true;
                        });
                        $scope.$apply();
                    }
                    else
                        $rootScope.errorHandler(e);
                }
                else
                    $rootScope.errorHandler(e);
            };

            
                // Register the user first
                SanteDB.resources.securityUser.insertAsync({
                    $type: "SecurityUserInfo",
                    role: $scope.target.role,
                    entity: $scope.target.entity
                }).then(function (u) {
                    $scope.target.userEntity.securityUser = u.entity.id;
                    SanteDB.resources.userEntity.insertAsync($scope.target.userEntity)
                        .then(successFn)
                        .catch(errorFn)
                })
                    .catch(errorFn);
        }

        /**
        * @summary Watch for password changes
        */
        $scope.$watch("target.entity.password", function (n, o) {
            if (n)
                $scope.strength = SanteDB.application.calculatePasswordStrength(n);
        });

    }]);