angular.module('santedb').controller('NotificationTemplateTableController', ["$scope", "$timeout", function ($scope, $timeout) {

    $scope.delete = async function(id, index) {
        if(confirm(SanteDB.locale.getString("ui.admin.notifications.template.delete.confirm"))) {
            try {
                await SanteDB.resources.notificationTemplate.deleteAsync(id, true);
                toastr.success(SanteDB.locale.getString("ui.admin.notifications.template.delete.success"));
                $("#NotificationTemplateTable table").DataTable().draw();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.notifications.template.delete.error", { e: e.message }));
            }
        }
    }

    async function initializeView() { }

    initializeView();
}]);