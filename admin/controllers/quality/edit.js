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
 * Date: 2024-1-5
 */
angular.module('santedb').controller('DataQualityRuleEditController', ["$scope", "$rootScope", "$timeout", "$stateParams", function ($scope, $rootScope, $timeout, $stateParams) {


    async function initializeView(id) {
        try {
            var ruleConfiguration = await SanteDB.resources.dataQuality.getAsync(id, "full", null, true);
            $timeout(() => $scope.rule = ruleConfiguration);
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    async function saveDataQualityRule(dataQualityRule) {

        try {
            SanteDB.display.buttonWait("#btnSaveDataQualityRule", true);

            dataQualityRule.$type = "SanteDB.Core.Data.Quality.Configuration.DataQualityRulesetConfiguration, SanteDB.Core.Api";

            var result = await SanteDB.resources.dataQuality.updateAsync(dataQualityRule.id, dataQualityRule, true);

            toastr.success(SanteDB.locale.getString("ui.model.dataQualityRule.save.success"));
            $timeout(() => $scope.rule = result);
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnSaveDataQualityRule", false);
        }
    }

    if($stateParams.id) {
        initializeView($stateParams.id);
    }
    else {
        $scope.rule = {
            "$type": "DataQualityRulesetConfiguration",
            resources: []
        }
    }


    $scope.removeResource = function(index) {
        if(!$scope.rule.resources[index].assert ||
            $scope.rule.resources[index].assert.length == 0 ||
            confirm(SanteDB.locale.getString("ui.model.dataQualityRule.resource.removeConfirm"))) {
                $scope.rule.resources.splice(index, 1);
            }
    }


    $scope.saveDataQualityRule = function(form) {
        if(form.$invalid) { return; }
        
        saveDataQualityRule($scope.rule);
    }
}]);