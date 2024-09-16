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