/// <reference path="../../../../core/js/santedb.js"/>

angular.module('santedb').controller('NotificationsTemplateEditController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $stateParams, $timeout) {

    async function initializeView(id) {
        if (id) {
            try {
                var notificationTemplate = await Promise.all([
                    await SanteDB.resources.NotificationTemplate.getAsync(id, null, null, true),
                ])
                console.log(notificationTemplate[0])
                $scope.notificationTemplate = notificationTemplate[0]
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
        }
        else {
            $scope.notificationTemplate = new NotificationTemplate({
                id: SanteDB.application.newGuid(),
                tags: [],
                parameters: [{}],
                contents: [{}]
            })
        }
    }

    // Save notification template
    async function saveNotificationTemplate(createNotificationTemplateForm, event) {
        if (createNotificationTemplateForm.$invalid) return;

        // determine whether the template was drafted or published
        if (event == "publishTemplateButton") {
            $scope.notificationTemplate.status = "1FAFD226-CAD4-47F2-87E6-7C8F3E9E3B6F"
        } else if (event == "saveDraftTemplateButton") {
            $scope.notificationTemplate.status = "0AC6638B-4E72-466A-A20F-1ADB3B8F2139"
        }

        try {
            SanteDB.display.buttonWait("#publishTemplateButton", true);
            SanteDB.display.buttonWait("#saveDraftTemplateButton", true);
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
            SanteDB.display.buttonWait("#publishTemplateButton", false);
            SanteDB.display.buttonWait("#saveDraftTemplateButton", false);
        }
    }

    $scope.saveNotificationTemplate = saveNotificationTemplate
    $scope.newParameter = {}
    $scope.newTemplate = {}

    if ($stateParams.id) {
        $scope.isLoading = true;
    }
    initializeView($stateParams.id)
}]);