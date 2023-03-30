/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('EntityDemographicsController', ['$scope', '$rootScope', "$timeout", function ($scope, $rootScope, $timeout) {

    $scope.update = async function (form) {

        if (form.$invalid) {
            return false;
        }

        // Now post the changed update object 
        try {
            var submissionObject = angular.copy($scope.editObject);
            await prepareEntityForSubmission(submissionObject);
            var bundle = new Bundle({ resource: [submissionObject] });
            await SanteDB.resources.bundle.insertAsync(bundle);
            var updated = await SanteDB.resources[submissionObject.$type.toCamelCase()].getAsync($scope.scopedObject.id, "full"); // re-fetch the place
         
            $timeout(() => {
                SanteDB.display.cascadeScopeObject(SanteDB.display.getRootScope($scope), ['scopedObject', 'entity'], updated);
            });
            toastr.success(SanteDB.locale.getString("ui.model.entity.saveSuccess"));
            form.$valid = true;

        }
        catch (e) {
            $rootScope.errorHandler(e);
            form.$valid = false;
        }

    }
}]);