angular.module('santedb').controller('NewNotificationController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $stateParams, $timeout) {

    async function initializeView() {
        console.log("initialize view")
        $scope.notificationInstance = {
            $type: 'NotificationInstance',
            state: 'AC843892-F7E0-47B6-8F84-11C14E7E96C6',
            template: null,
            parameters: [],
        }
    }
    
    $scope.saveNotificationInstance = async function(notificationInstanceForm, event) {
        if (notificationInstanceForm.$invalid) return;

        console.log($scope.notificationInstance)

        try {
            SanteDB.display.buttonWait("#saveNotificationInstanceButton", true);
            SanteDB.display.buttonWait("#cancelNotificationInstanceButton", true);

            await SanteDB.resources.notificationInstance.insertAsync($scope.notificationInstance, true);
            
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

    $scope.goToNewTemplate = async function() {
        $state.go("santedb-admin.notifications.templates.create")
    }

    initializeView()

    $scope.$watch("notificationInstance.template", async function(n, o) {
        if(n != o && n) {
            const template = await SanteDB.resources.notificationTemplate.getAsync($scope.notificationInstance.template, null, null, true)

            $timeout(() => {
                $scope.notificationInstance.parameters = template.parameters           
            })
        }
    })
}]);