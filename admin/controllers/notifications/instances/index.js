angular.module('santedb').controller('NotificationInstanceIndexController', ["$scope", "$rootScope", "$state", "$templateCache", function ($scope, $rootScope, $state, $templateCache) {
    async function initializeView() {
        
        $scope.delete = async function(id, index) {
            if(confirm(SanteDB.locale.getString("ui.admin.notifications.instances.delete.confirm"))) {
                try {
                    await SanteDB.resources.notificationInstance.deleteAsync(id, true);
                    toastr.success(SanteDB.locale.getString("ui.admin.notifications.instances.delete.success"));
                    $("#NotificationInstanceTable table").DataTable().ajax.reload();
                }
                catch(e) {
                    toastr.error(SanteDB.locale.getString("ui.admin.notifications.instances.delete.error", { e: e.message }));
                }
            }
        }

    }

    initializeView();
}]);