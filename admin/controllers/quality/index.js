angular.module('santedb').controller('DataQualityIndexController', ["$scope", function ($scope) {

    $scope.renderEnabled = (r) => {
        if(r.enabled) {
            return '<span class="text-success"><i class="fas fa-check"></i> {{ "ui.state.active" | i18n }}</span>';
        }
        else {
            return '<span class="text-danger"><i class="fas fa-times"></i> {{ "ui.state.inactive" | i18n }}</span>';
        }
    }

    $scope.renderResources = (r) => r.resources.map(o=>o.resource).join(", ");

    $scope.delete = async function(id) {
        if(confirm(SanteDB.locale.getString("ui.admin.dataQuality.delete.confirm"))) {
                await SanteDB.resources.dataQuality.deleteAsync(id, true);
                $("#DataQualityRuleTable table").DataTable().ajax.reload();
        }
    }
}]);
