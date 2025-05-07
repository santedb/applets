angular.module('santedb').controller('NotificationsTemplateEditController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $stateParams, $timeout) {

    function initializeView() {
        $scope.formData = {
            parameters: [{}],
            templates: [{}]
        }
        $scope.newParameter = {}
        $scope.newTemplate = {}
    }

    // Save notification template
    async function saveNotificationTemplate(createNotificationTemplateForm) {
        if (createNotificationTemplateForm.$invalid) return;

        try {
            SanteDB.display.buttonWait("#saveNotificationTemplateButton", true);
            // Update
            var notificationTemplate = null;
            if ($stateParams.id) {
                notificationTemplate = await SanteDB.resources.notificationTemplate.updateAsync($stateParams.id, $scope.notificationTemplate);
            }
            else {
                notificationTemplate = await SanteDB.resources.notificationTemplate.insertAsync($scope.notificationTemplate);
            }
            toastr.success(SanteDB.locale.getString("ui.admin.notificationTemplate.save.success"));

            if (!$stateParams.id) {
                $state.go("santedb-admin.notifications.templates.index");
            }
            else {
                $timeout(() => $scope.notificationTemplate = notificationTemplate);
            }
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveNotificationTemplateButton", false);
        }
    }

    $scope.saveNotificationTemplate = saveNotificationTemplate

    initializeView()
}]);