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