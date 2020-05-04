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
angular.module('santedb').controller('EditUserController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {

    $scope.EntityClassKeys = EntityClassKeys;
    
    // Get format information
    SanteDB.locale.getFormatInformationAsync()
        .then(function(d) {
            $scope.refLangs = Object.keys(d);
            $scope.$apply();
        })
        .catch(function(f) { console.warn(f); });

    // Get the specified user
    if ($stateParams.id) {
        $scope.isLoading = true;
        SanteDB.resources.securityUser.getAsync($stateParams.id)
            .then(function (u) {
                $scope.isLoading = !$scope.target;
                $scope.target = $scope.target || {};
                $scope.target.role = u.role;
                $scope.target.securityUser = u.entity;
                $scope.target.securityUser.etag = u.etag;
                $scope.$apply();
            })
            .catch($rootScope.errorHandler);

        // Get the related user entity at the same time
        SanteDB.resources.userEntity.findAsync({ securityUser: $stateParams.id })
            .then(function (u) {
                $scope.isLoading = !$scope.target;
                $scope.target = $scope.target || {};

                if (u.resource && u.resource.length > 0) {
                    $scope.target.entity = u.resource[0];
                    
                    // Load inverse relationships
                    if(u.resource[0].relationship && !u.resource[0].relationship.Employee)
                        SanteDB.resources.entityRelationship.findAsync({ target: u.resource[0].id, relationshipType: EntityRelationshipTypeKeys.Employee, _viewModel: "relationship_full" })
                            .then(function(er) {
                                if(er.resource)
                                    er.resource.forEach(function(eri) { 
                                        $scope.target.entity.relationship[eri.relationshipTypeModel.mnemonic] = $scope.target.entity.relationship[eri.relationshipTypeModel.mnemonic] || [];
                                        $scope.target.entity.relationship[eri.relationshipTypeModel.mnemonic].push(eri);

                                    });
                            })
                }
                else 
                    $scope.target.entity = new UserEntity({
                        language : [
                            {
                                "languageCode" : SanteDB.locale.getLanguage(),
                                "isPreferred" : true
                            }
                        ]
                    });

                // Set language
                if(!$scope.target.entity.language)
                    $scope.target.preferredLanguage = SanteDB.locale.getLanguage();
                else if(!Array.isArray($scope.target.entity.language))
                    $scope.target.preferredLanguage = $scope.target.entity.language.languageCode;
                else 
                {
                    var lng = $scope.target.entity.language.find(function(l) { return l.isPreferred; });
                    if(!lng)
                        lng = { "languageCode" : SanteDB.locale.getLanguage() };
                    $scope.target.preferredLanguage = lng.languageCode;
                }

                $scope.$apply();
            })
            .catch($rootScope.errorHandler);
    }
    else  // New user
    {
        $scope.target = {
            securityUser: new SecurityUser(),
            entity: new UserEntity({
                language : [
                    {
                        "languageCode" : SanteDB.locale.getLanguage(),
                        "isPreferred" : true
                    }
                ]
            }),
            preferredLanguage:  SanteDB.locale.getLanguage(),
            roles: []
        };

        /**
         * @summary Watch for changes to the username if we're creating and warn of duplicates
         */
        $scope.$watch("target.securityUser.userName", function (n, o) {
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
     * @summary Reset password for the current
     */
    $scope.resetPassword = function () {
        // Show wait
        SanteDB.display.buttonWait("#resetPasswordButton", true);

        // Setup password change request
        $scope.password = {
            id: $scope.target.securityUser.id,
            entity: {
                userName: $scope.target.securityUser.userName,
                id: $scope.target.securityUser.id,
                password: null
            },
            passwordOnly : true
        };
        $("#passwordModal").modal({ backdrop: 'static' });

        // User has pressed save or cancelled
        $("#passwordModal").on('hidden.bs.modal', function () {
            $scope.password = null;
            SanteDB.display.buttonWait("#resetPasswordButton", false);
        });

    }

    /**
     * @summary Reactivate Inactive User
     */
    $scope.reactivateUser = function() {
        if(!confirm(SanteDB.locale.getString("ui.admin.users.reactivate.confirm")))
            return;
        
        var patch = new Patch({
            change: [
                new PatchOperation({
                    op: PatchOperationType.Remove,
                    path: 'obsoletionTime',
                    value: null
                }),
                new PatchOperation({
                    op: PatchOperationType.Remove,
                    path: 'obsoletedBy',
                    value: null
                })
            ]
        });

        // Send the patch
        SanteDB.display.buttonWait("#reactivateUserButton", true);
        SanteDB.resources.securityUser.patchAsync($stateParams.id, $scope.target.securityUser.etag, patch)
            .then(function(r) {
                $scope.target.securityUser.obsoletionTime = null;
                $scope.target.securityUser.obsoletedBy = null;
                SanteDB.display.buttonWait("#reactivateUserButton", false);
                $scope.$apply();
            })
            .catch(function(e) { 
                $rootScope.errorHandler(e); 
                SanteDB.display.buttonWait("#reactivateUserButton", false);
            });

    }

    /**
     * @summary Reset invalid logins
     */
    $scope.resetInvalidLogins = function() {
        if(!confirm(SanteDB.locale.getString("ui.admin.users.invalidLogin.reset")))
            return;

        var patch = new Patch({
            change: [
                new PatchOperation({
                    op: PatchOperationType.Replace,
                    path: "invalidLoginAttempts",
                    value: 0
                })
            ]
        });

        SanteDB.display.buttonWait("#resetInvalidLoginButton", true);
        SanteDB.resources.securityUser.patchAsync($stateParams.id, $scope.target.securityUser.etag, patch)
            .then(function(r) {
                SanteDB.display.buttonWait("#resetInvalidLoginButton", false);
                $scope.target.securityUser.invalidLoginAttempts = 0;
                $scope.$apply();
            })
            .catch(function(e) {
                $rootScope.errorHandler(e);
                SanteDB.display.buttonWait("#resetInvalidLoginButton", false);
            })
    }

     /**
     * @summary Unlock user
     */
    $scope.unlock = function() {
        if(!confirm(SanteDB.locale.getString("ui.admin.users.confirmUnlock")))
            return;

        SanteDB.display.buttonWait("#unlockButton", true);
        SanteDB.resources.securityUser.unLockAsync($stateParams.id)
            .then(function(r) {
                SanteDB.display.buttonWait("#unlockButton", false);
                $scope.target.securityUser.lockout = null;
                $scope.$apply();
            })
            .catch(function(e) {
                $rootScope.errorHandler(e);
                SanteDB.display.buttonWait("#unlockButton", false);
            })
    }

     /**
     * @summary Watch for password changes
     */
    $scope.$watch("target.securityUser.password", function (n, o) {
        if(n) 
            $scope.strength = SanteDB.application.calculatePasswordStrength(n);
    });


    /**
     * @summary Save the specified user 
     */
    $scope.saveUser = function(userForm) {

        if(!userForm.$valid) return;

        // First, copy telecoms over to the user entity
        $scope.target.entity.telecom = $scope.target.entity.telecom || {};
        $scope.target.entity.telecom.MobileContact = [];
        $scope.target.entity.telecom.WorkPlace = [];
        if($scope.target.securityUser.phoneNumber)
            $scope.target.entity.telecom.MobileContact.push({value: `tel://${$scope.target.securityUser.phoneNumber}` });
        if($scope.target.securityUser.email)
            $scope.target.entity.telecom.WorkPlace.push({ value: `mailto:${$scope.target.securityUser.email}` });
        
        // Correct arrays and assign id
        if(!$scope.target.entity.id) {
            $scope.target.entity.id = SanteDB.application.newGuid();
        }

        // Set preferred language
        delete($scope.target.entity.language);
        $scope.target.entity.language = {
            "isPreferred" : true,
            "languageCode" : $scope.target.preferredLanguage
        };

        if($scope.target.entity.relationship) {
            if(Array.isArray($scope.target.entity.relationship.DedicatedServiceDeliveryLocation))
                $scope.target.entity.relationship.DedicatedServiceDeliveryLocation = $scope.target.entity.relationship.DedicatedServiceDeliveryLocation.map(function(d) {
                    return { source: $scope.target.entity.id,  target: d.target };
                });

            if(Array.isArray($scope.target.entity.relationship.Employee))
                $scope.target.entity.relationship.Employee = $scope.target.entity.relationship.Employee.map(function(d) {
                    return { target: $scope.target.entity.id, holder: d.holder };
                });
            else if($scope.target.entity.relationship.Employee)
                $scope.target.entity.relationship.Employee.holder = $scope.target.entity.id;

        }

        // Show wait state
        SanteDB.display.buttonWait("#saveUserButton", true);

        // Success fn
        var successFn = function(r) { 
            // Now save the user entity
            toastr.success(SanteDB.locale.getString("ui.admin.users.saveConfirm"));
            SanteDB.display.buttonWait("#saveUserButton", false);
            $state.transitionTo("santedb-admin.security.users.index");
        };
        var errorFn = function(e) {
            SanteDB.display.buttonWait("#saveUserButton", false);
            if(e.$type == "DetectedIssueException" && userForm.newPassword) { // Error with password?
                userForm.newPassword.$error = {};
                var passwdRules = e.rules.filter(function(d) { return d.priority == "Error" && d.text == "err.password"; }); 
                if(passwdRules.length == e.rules.length) {
                    passwdRules.forEach(function(d) {
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

        // user is already registered we are updating them 
        if($scope.target.securityUser.id)
        {
            // Register the user first
            SanteDB.resources.securityUser.updateAsync($scope.target.securityUser.id, {
                $type: "SecurityUserInfo",
                role: $scope.target.role,
                entity: $scope.target.securityUser
            }).then(function(u) {
                $scope.target.entity.securityUser = u.entity.id;
                SanteDB.resources.userEntity.insertAsync($scope.target.entity)
                    .then(successFn)
                    .catch(errorFn)
            })
            .catch(errorFn);
        }
        else {
            // Register the user first
            SanteDB.resources.securityUser.insertAsync({
                $type: "SecurityUserInfo",
                role: $scope.target.role,
                entity: $scope.target.securityUser
            }).then(function(u) {
                $scope.target.entity.securityUser = u.entity.id;
                SanteDB.resources.userEntity.insertAsync($scope.target.entity)
                    .then(successFn)
                    .catch(errorFn)
            })
            .catch(errorFn);
        }
    }
}]);