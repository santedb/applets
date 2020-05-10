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

    /**
     * Updates the user entity
     */
    $scope.update = async function(form) {

        if(form.$invalid) return; // don't process invalid form

        var submissionObject = angular.copy($scope.editObject);
        // Update target identifiers with the original
        if (submissionObject.address)  {
            addressList = [];
            var promises = Object.keys(submissionObject.address).map(async function (k) {
                try {
                    var addr = submissionObject.address[k];
                    addr.use = addr.useModel.id;
                    addr.component = addr.component || {};
                    delete(addr.useModel);
                    if (addr.targetId) {
                        var addrComponents = (await SanteDB.resources.place.getAsync(addr.targetId)).address.Direct.component;
                        addr.component.Country = addrComponents.Country;
                        addr.component.CensusTract = addrComponents.CensusTract;
                        addr.component.County = addrComponents.County;
                        addr.component.State = addrComponents.State;
                        addr.component.Precinct = addrComponents.Precinct;
                        addr.component.City = addrComponents.City;
                    }
                    addressList.push(addr);
                }
                catch(e) {
                }
            });
            await Promise.all(promises);
            submissionObject.address = { "$other": addressList };
        }
        if(submissionObject.name)
        {
            var nameList = [];
            Object.keys(submissionObject.name).forEach(function(k) { 
                var name = submissionObject.name[k];
                name.use = name.useModel.id; 
                delete(name.useModel);
                nameList.push(name);
            });
            submissionObject.name = { "$other" : nameList };
        }
        
        // Now post the changed update object 
        try {
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