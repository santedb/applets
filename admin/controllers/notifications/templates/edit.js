angular.module('santedb').controller('NotificationsTemplateEditController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $stateParams, $timeout) {

    async function initializeView(id) {
        if (id !== undefined) {
            try {
                var notificationTemplate = await Promise.all([
                    await SanteDB.resources.notificationTemplate.getAsync(id, null, null, true),
                ])
                console.log(notificationTemplate[0])
                $scope.notificationTemplate = notificationTemplate[0]
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
        }
        else {
            $scope.notificationTemplate = new notificationTemplate({
                id: SanteDB.application.newGuid(),
                parameters: [{}],
                contents: [{}]
            })
        }

        $scope.newParameter = {}
        $scope.newTemplate = {}

    }

    // Save notification template
    async function saveNotificationTemplate(createNotificationTemplateForm) {
        if (createNotificationTemplateForm.$invalid) return;

        console.log(createNotificationTemplateForm)

        // try {
        //     SanteDB.display.buttonWait("#saveNotificationTemplateButton", true);
        //     // Update
        //     var notificationTemplate = null;
        //     if ($stateParams.id) {
        //         notificationTemplate = await SanteDB.resources.notificationTemplate.updateAsync($stateParams.id, $scope.notificationTemplate);
        //     }
        //     else {
        //         notificationTemplate = await SanteDB.resources.notificationTemplate.insertAsync($scope.notificationTemplate);
        //     }
        //     toastr.success(SanteDB.locale.getString("ui.admin.notificationTemplate.save.success"));

        //     if (!$stateParams.id) {
        //         $state.go("santedb-admin.notifications.templates.index");
        //     }
        //     else {
        //         $timeout(() => $scope.notificationTemplate = notificationTemplate);
        //     }
        // }
        // catch (e) {
        //     $rootScope.errorHandler(e);
        // }
        // finally {
        //     SanteDB.display.buttonWait("#saveNotificationTemplateButton", false);
        // }
    }

    $scope.saveNotificationTemplate = saveNotificationTemplate

    if ($stateParams.id) {
        $scope.isLoading = true;
    }
    initializeView($stateParams.id)
}]);