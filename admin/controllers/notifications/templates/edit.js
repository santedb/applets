/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../viewEditor.js"/>

angular.module('santedb').controller('NotificationsTemplateEditController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $stateParams, $timeout) {

    async function initializeView(id) {
        $scope.notificationTemplate = {
            $type: "NotificationTemplate",
            id: SanteDB.application.newGuid(),
            tags: [],
            parameters: [{}],
            contents: [{}]
        }

        if (id !== undefined) {
            try {
                var notificationTemplate = await Promise.all([
                    await SanteDB.resources.notificationTemplate.getAsync(id, null, null, true),
                ])
                $timeout(() => {
                    $scope.isLoading = false;
                    $scope.notificationTemplate = notificationTemplate[0]
                    $scope.notificationTemplate.contents.forEach((template, index) => {
                        $scope.createEditor(template, index)
                    });
                })
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
        } else {
            $scope.notificationTemplate = {
                $type: "NotificationTemplate",
                id: SanteDB.application.newGuid(),
                tags: [],
                parameters: [{}],
                contents: [{}]
            }
            $scope.createEditor($scope.notificationTemplate.contents[0], 0)
        }
    }

    $scope.createEditor = function (template, index) {
        var tempData = { views: [{ type: "div", content: "" }] }
        if (template.text) {
            tempData.content = template.text
        }
        if (!$scope.cdssEditors[index]) {
            var editorId = "cdssEditor" + index
            setTimeout(() => {
                $scope.cdssEditors[index] = new ViewAceEditor(editorId, tempData, "div");
            }, 10);
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

        //retrieve contents body values from all CDSS editors
        $scope.cdssEditors.forEach((editor, index) => {
            $scope.notificationTemplate.contents[index].text = editor.getValue()
        });


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

    $scope.addNewTemplate = function () {
        $scope.notificationTemplate.contents.push($scope.newTemplate);
        $scope.newTemplate = {}
        var templateDefinitions = { views: [{ type: "div", content: "" }] }

        setTimeout(() => {
            var editorId = "cdssEditor" + $scope.cdssEditors.length
            $scope.cdssEditors.push(new ViewAceEditor(editorId, templateDefinitions, "div"));
        }, 10)
    }

    $scope.saveNotificationTemplate = saveNotificationTemplate
    $scope.newParameter = {}
    $scope.newTemplate = {}
    $scope.cdssEditors = []

    if ($stateParams.id) {
        $scope.isLoading = true;
    }
    initializeView($stateParams.id)
}]);