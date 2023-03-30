/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
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
 * Date: 2019-9-20
 */
angular.module('santedb').controller('FacilityServiceController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

    // Save service schedule
    $scope.saveServiceSchedule = async function(form) {
        if(form.$invalid) {
            return;
        }
        try {

            await SanteDB.resources.place.checkoutAsync($scope.editObject.id);

            var submitPlace = new Place(angular.copy($scope.editObject));
            // Remove all associated properties - we don't want to edit those 
            delete(submitPlace.address);
            delete(submitPlace.name);
            delete(submitPlace.geo);
            delete(submitPlace.note);
            delete(submitPlace.extension);
            delete(submitPlace.tag);
            delete(submitPlace.participation);
            delete(submitPlace.policy);
            delete(submitPlace.relationship);
            delete(submitPlace.telecom);
            deleteModelProperties(submitPlace);

            // Submit the place edits
            await SanteDB.resources.place.updateAsync($scope.editObject.id, submitPlace);

            toastr.success(SanteDB.locale.getString("ui.admin.facility.services.save.success"));
            await SanteDB.resources.place.checkinAsync($scope.editObject.id);
            var updated = await SanteDB.resources.place.getAsync($scope.editObject.id, "full");
            $timeout(() => {
                SanteDB.display.cascadeScopeObject(SanteDB.display.getRootScope($scope), ['scopedObject', 'entity'], updated);
            });
        }
        catch(e) {
            toastr.error(SanteDB.locale.getString("ui.admin.facility.services.save.failure", {e: e.message}));
            $rootScope.errorHandler(e);
        }
    }
}]);
    