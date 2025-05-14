/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../../cdss/codeEditor.js"/>

angular.module('santedb').controller('NotificationsTemplateEditController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $stateParams, $timeout) {

    async function initializeView(id) {
        if (id !== undefined) {
            try {
                var notificationTemplate = await Promise.all([
                    await SanteDB.resources.notificationTemplate.getAsync(id, null, null, true),
                ])
                $timeout(() => {
                    $scope.isLoading = false;
                    $scope.notificationTemplate = notificationTemplate[0]
                })
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
        }
        else {
            $scope.notificationTemplate = {
                $type: "NotificationTemplate",
                id: SanteDB.application.newGuid(),
                tags: [],
                parameters: [{}],
                contents: [{}]
            }
        }

        // initialize CDSS editors
        editors = []

        var libraryDefinition = await SanteDB.resources.cdssLibraryDefinition.getAsync("abfc7ee8-1322-11f0-afa5-9f82d72aea23", null, null, true);
        $timeout(() => {
            $scope.cdssLibrary = libraryDefinition;
            $scope.notificationTemplate.contents.forEach((template, index) => {
                var editorId = "cdssEditor" + index
                editors[index] = new CdssAceEditor(editorId, template.text, $scope.cdssLibrary.id, "abfc7ee8-1322-11f0-afa5-9f82d72aea23");
                editors[index].validateEditor(true);
            });
        });


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



        // convert list of tags into a single string
        var tagList = $scope.notificationTemplate.tags.join(',')
        $scope.notificationTemplate.tags = tagList

        try {
            SanteDB.display.buttonWait("#publishTemplateButton", true);
            SanteDB.display.buttonWait("#saveDraftTemplateButton", true);
            // Update
            var notificationTemplate = null;
            if ($stateParams.id) {
                notificationTemplate = await SanteDB.resources.notificationTemplate.updateAsync($stateParams.id, $scope.notificationTemplate, upstream = true);
            }
            else {
                notificationTemplate = await SanteDB.resources.notificationTemplate.insertAsync($scope.notificationTemplate, upstream = true);
            }
            toastr.success(SanteDB.locale.getString("ui.admin.notificationTemplate.save.success"));

            $state.go("santedb-admin.notifications.templates.index");
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
    $scope.cdssLibrary = {}

    if ($stateParams.id) {
        $scope.isLoading = true;
    }
    initializeView($stateParams.id)
}]);