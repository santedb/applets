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
angular.module('santedb').controller('ForeignDataViewController', ["$scope", "$rootScope", "$timeout", "$state", "$stateParams", function ($scope, $rootScope, $timeout, $state, $stateParams) {


    // Initialize the view
    async function initialize(id) {
        try {
            var stagedData = await SanteDB.resources.foreignData.getAsync(id);
            document.title = document.title + " - " + stagedData.name;
            $timeout(() => $scope.stagedData = stagedData);
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    if($stateParams.id) {
        initialize($stateParams.id);
    }
    else {
        $stateParams.go("santedb-admin.data.import.index");
    }
}]);