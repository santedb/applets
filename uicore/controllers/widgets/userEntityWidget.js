/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('CoreUserWidgetController', ['$scope', '$rootScope', function ($scope, $rootScope) {


  
    $scope.$watch("scopedObject", async function(n, o) {
        if(n) {
            if(n.language)  {
                n.preferredLanguage = n.language.find(o => o.isPreferred);
            }
            $scope.editObject = angular.copy(n);

             // Get TFA
             try {
                var tfaData = await SanteDB.authentication.getTfaModeAsync();
                $scope.tfaMechanisms = tfaData.resource;
            }
            catch(e) {
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
    $scope.update = async function(form) {

        if(form.$invalid) return; // don't process invalid form

        
       
        // Now post the changed update object 
        try {
            var submissionObject = angular.copy($scope.editObject);
            await correctEntityInformation(submissionObject);

            if(submissionObject.id) {
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
        catch(e) 
        {
            $rootScope.errorHandler(e);
            form.$valid = false;
        }
    }

    /**
     * Update security user
     */
    $scope.updateSecurity = async function(userForm) {

        if(userForm.$invalid) return;

        // Set roles
        try {
            var userSubmission = {
                $type: "SecurityUserInfo",
                entity : $scope.scopedObject.securityUserModel
            };

            var result = await SanteDB.resources.securityUser.updateAsync(userSubmission.entity.id, userSubmission);
            result = await SanteDB.resources.securityUser.getAsync(result.entity.id);
            $scope.scopedObject.securityUserModel = result.entity;
            toastr.success(SanteDB.locale.getString("ui.admin.users.saveConfirm"));
        }
        catch(e) {
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