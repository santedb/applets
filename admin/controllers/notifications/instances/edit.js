angular.module('santedb').controller('NotificationsInstanceEditController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $stateParams, $timeout) {
    async function initializeView(id) {
        if (id !== undefined) {
            try {
                const notificationInstance = await SanteDB.resources.notificationInstance.getAsync(id, null, null, true);
                $scope.notificationInstance = notificationInstance;
            } catch (e) {
                $rootScope.errorHandler(e);
            }
        } else {
            $scope.notificationInstance = new notificationInstance({
                id: SanteDB.application.newGuid(),
                parameters: [{}],
            }) 
        }
    }
    
    $scope.saveNotificationInstance = async function(notificationInstanceForm, event) {
        console.log($scope.notificationInstance);
        if (notificationInstanceForm.$invalid) return;


        try {
            SanteDB.display.buttonWait("#saveNotificationInstanceButton", true);
            SanteDB.display.buttonWait("#cancelNotificationInstanceButton", true);

            var notificationInstance = null;

            notificationInstance = await SanteDB.resources.notificationInstance.updateAsync($stateParams.id, $scope.notificationInstance);
            
            toastr.success(SanteDB.locale.getString("ui.admin.notification.instance.save.success"));
            
            $state.go("santedb-admin.notifications.Instances.index");
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveNotificationInstanceButton", false);
            SanteDB.display.buttonWait("#cancelNotificationInstanceButton", false);
        }
    }

    if($stateParams.id) {
        $scope.isLoading = true;
    }

    initializeView($stateParams.id)
}]);