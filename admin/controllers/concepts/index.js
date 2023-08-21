/// <reference path="../../../core/js/santedb.js"/>
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
