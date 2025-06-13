/// <Reference path="../../../core/js/santedb.js" />

angular.module("santedb").controller("ElevateController", ["$scope", "$state", function($scope, $state) {

    $scope.logoutRedirect = async function() {
        try {
            await SanteDB.authentication.logoutAsync();
            $state.go("login");
        }
        catch(e) {
            console.error(e);
            alert(SanteDB.locale.getString("ui.error.logout.error"));
        }
    }
}])