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
angular.module('santedb')
    .controller('EditUserController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $templateCache, $stateParams, $timeout) {

        $scope.EntityClassKeys = EntityClassKeys;

        async function initializeView(id) {

            try {
                var securityUser = await SanteDB.resources.securityUser.getAsync(id);
                var userEntity = await SanteDB.resources.userEntity.findAsync({ securityUser: id, _viewModel: 'full' });
                $timeout(()=> {
                    $scope.isLoading = false;
                    $scope.target = $scope.target || {};
                    $scope.target.role = securityUser.role;
                    $scope.target.id = securityUser.id;
                    $scope.target.entity = securityUser.entity;
                    $scope.target.entity.etag = securityUser.etag;
                    document.title = document.title + " - " + securityUser.entity.userName;

                    if(userEntity.resource) {
                        $scope.target.userEntity = userEntity.resource[0];
                    } 
                    else {
                        $scope.target.userEntity = new UserEntity({
                            id: SanteDB.application.newGuid(),
                            language: [
                                {
                                    "languageCode": SanteDB.locale.getLanguage(),
                                    "isPreferred": true
                                }
                            ],
                            securityUser: $stateParams.id,
                            name: {
                                OfficialRecord: [
                                    { 
                                        component: {
                                            Given: [ securityUser.entity.userName ]
                                        }
                                    }
                                ]
                            },
                            telecom: {
                                Public: [

                                ]
                            },
                            address: {
                                HomeAddress: [
                                    {
                                        use: AddressUseKeys.HomeAddress    
                                    }
                                ]
                            }
                        });
                    }

                    // Set language
                    if (!$scope.target.userEntity.language)
                        $scope.target.userEntity.preferredLanguage = SanteDB.locale.getLanguage();
                    else if (!Array.isArray($scope.target.userEntity.language))
                        $scope.target.userEntity.preferredLanguage = $scope.target.userEntity.language.languageCode;
                    else {
                        var lng = $scope.target.userEntity.language.find(function (l) { return l.isPreferred; });
                        if (!lng)
                            lng = { "languageCode": SanteDB.locale.getLanguage() };
                        $scope.target.userEntity.preferredLanguage = lng.languageCode;
                    }
                });
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
        }

        // Get the specified user
        if ($stateParams.id) {
            $scope.isLoading = true;
            initializeView($stateParams.id)
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
                $state.go("santedb-admin.security.users.index");
            };
            var errorFn = function (e) {
                SanteDB.display.buttonWait("#saveUserButton", false);
                if (e.$type == "DetectedIssueException" && userForm.newPassword) { // Error with password?
                    $timeout(() => {
                        userForm.newPassword.$error = {};
                        e.rules.filter(r=>r.priority == "Error").forEach(r => {
                            switch(d.id) {
                                case "password.complexity":
                                    userForm.newPassword.$error[d.id] = true;
                                    break;
                                case "password.history":
                                    userForm.newPassword.$error[d.id] = true;
                                    break;
                            }
                        })
                        var passwdRules = e.rules.filter(function (d) { return d.priority == "Error" && d.text == "err.password.complexity"; });
                        if (passwdRules.length == e.rules.length) {
                            passwdRules.forEach(function (d) {
                                userForm.newPassword.$error[d.text] = true;
                            });
                            $scope.$apply();
                        }
                        else
                            $rootScope.errorHandler(e);
    
                    });
                }
                else
                    $rootScope.errorHandler(e);
            };

            
                // Register the user first
                SanteDB.resources.securityUser.insertAsync({
                    $type: "SecurityUserInfo",
                    role: $scope.target.role,
                    entity: $scope.target.entity,
                    expirePassword: $scope.target.expirePassword
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