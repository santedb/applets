/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('CoreUserWidgetController', ['$scope', '$rootScope', function ($scope, $rootScope) {



    $scope.$watch("scopedObject", async function (n, o) {
        if (n) {
            if (n.language) {
                n.preferredLanguage = n.language.find(o => o.isPreferred);
            }
            $scope.editObject = angular.copy(n);

            // Get TFA
            try {
                if($rootScope.session.method != 'LOCAL') {
                    var tfaData = await SanteDB.authentication.getTfaModeAsync();
                    $scope.tfaMechanisms = tfaData.resource;
                }
            }
            catch (e) {
                console.warn(e);
            }

            // Get challenges
            try {
                var challenges = await SanteDB.resources.securityChallenge.findAsync();
                $scope.challenges = challenges.resource;
                var userChallenges = await SanteDB.resources.securityUser.findAssociatedAsync(n.securityUser, "challenge");
                if (userChallenges.resource && userChallenges.resource.length > 0)
                    $scope.editObject.challenges = userChallenges.resource.map(function (i) { i.challenge = i.id, i.response = "XXXXXXX"; i.configured = true; return i; });
                else
                    $scope.editObject.challenges = [];
                while ($scope.editObject.challenges.length < 3)
                    $scope.editObject.challenges.push({ challenge: null });
            }
            catch (e) {
                console.warn(e);
            }
        }
    });

    /** Correct entity information  */
    async function correctEntityInformation(entity) {
        // Update the address - Correcting any linked addresses to the strong addresses
        // TODO: 
        if (entity.address) {
            var addressList = [];
            var promises = Object.keys(entity.address).map(async function (k) {
                try {
                    var addr = entity.address[k];
                    if (!Array.isArray(addr))
                        addr = [addr];

                    var intlPromises = addr.map(async function (addrItem) {
                        addrItem.use = addrItem.useModel.id;
                        addrItem.component = addrItem.component || {};
                        delete (addrItem.useModel);
                        addressList.push(addrItem);
                    });
                    await Promise.all(intlPromises);
                }
                catch (e) {
                }
            });
            await Promise.all(promises);
            entity.address = { "$other": addressList };
        }
        if (entity.name) {
            var nameList = [];
            Object.keys(entity.name).forEach(function (k) {

                var name = entity.name[k];
                if (!Array.isArray(name))
                    name = [name];

                name.forEach(function (nameItem) {
                    nameItem.use = nameItem.useModel.id;
                    delete (nameItem.useModel);
                    nameList.push(nameItem);
                })

            });
            entity.name = { "$other": nameList };
        }

    }

    /**
     * Updates the user entity
     */
    $scope.update = async function (form) {

        if (form.$invalid) return; // don't process invalid form



        // Now post the changed update object 
        try {
            var submissionObject = angular.copy($scope.editObject);
            await correctEntityInformation(submissionObject);
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
                entity: $scope.scopedObject.securityUserModel
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
                                    await SanteDB.resources.securityUser.removeAssociatedAsync(userSubmission.entity.id, "challenge", o.challenge);
                                await SanteDB.resources.securityUser.addAssociatedAsync(userSubmission.entity.id, "challenge", {
                                    $type: "SecurityUserChallengeInfo",
                                    challenge: o.id,
                                    response: o.response
                                });
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