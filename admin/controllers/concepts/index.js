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
 * 
 * User: fyfej
 * Date: 2023-7-23
 */
angular.module('santedb').controller('ConceptDashboardController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

    async function initializeView() {
        try {
            var refData = await Promise.all([
                async function() { return { codeSystem : await SanteDB.resources.codeSystem.findAsync({_count: 0, _includeTotal: true}) }; }(),
                async function() { return { conceptSet : await SanteDB.resources.conceptSet.findAsync({_count: 0, _includeTotal: true}) }; }(),
                async function() { return { concepts : await SanteDB.resources.concept.findAsync({_count: 0, _includeTotal: true}) }; }(),
            ]);

            $timeout(() => {
                $scope.dashboard = {};
                refData.forEach(o => $scope.dashboard[Object.keys(o)[0]] = o[Object.keys(o)[0]].totalResults);
            });
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    initializeView();

}]);
