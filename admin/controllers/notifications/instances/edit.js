angular.module('santedb').controller('NotificationsInstanceEditController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $stateParams, $timeout) {
    async function initializeView(id) {
        if (id !== undefined) {
            try {
                const notificationInstance = await SanteDB.resources.notificationInstance.getAsync(id, null, null, true, null);
                
                setTimeout(() => {
                    $scope.notificationInstance = notificationInstance
                })
            } catch (e) {
                $rootScope.errorHandler(e);
            }
        } else {
            $scope.notificationInstance = {
                $type: 'NotificationInstance',
                state: 'AC843892-F7E0-47B6-8F84-11C14E7E96C6',
                template: null,
                parameters: [],
            }
        }
    }
    
    $scope.saveNotificationInstance = async function(notificationInstanceForm, event) {
        if (notificationInstanceForm.$invalid) return;


        try {
            SanteDB.display.buttonWait("#saveNotificationInstanceButton", true);
            SanteDB.display.buttonWait("#cancelNotificationInstanceButton", true);

            await SanteDB.resources.notificationInstance.updateAsync($stateParams.id, $scope.notificationInstance, true);
            
            toastr.success(SanteDB.locale.getString("ui.admin.notification.instance.save.success"));
            
            $state.go("santedb-admin.notifications.instances.index");
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

    $scope.$watch("notificationInstance.template", async function(n, o) {
        if(n != o && n) {
            const template = await SanteDB.resources.notificationTemplate.getAsync($scope.notificationInstance.template, null, null, true)

            $timeout(() => {
                $scope.notificationInstance.parameters = template.parameters           
            })
        }
    })
}]);