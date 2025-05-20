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
        var libraryDefinition = await SanteDB.resources.cdssLibraryDefinition.getAsync(null, null, null, true, { "oid": "1.3.6.1.4.1.52820.5.1.5.9.1" });
        $timeout(() => {
            $scope.cdssLibrary = libraryDefinition.resource[0].library;
        });

        $scope.notificationTemplate.contents.forEach((template, index) => {
            var editorId = "cdssEditor" + index
            $scope.cdssEditors[index] = new CdssAceEditor(editorId, template.text, $scope.cdssLibrary.id, $scope.cdssLibrary.uuid);
        });

        console.log($scope.cdssEditors)
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
            console.log(editor.getValue())
            $scope.notificationTemplate.contents[index].text = editor.getValue()
            console.log(index)
            console.log($scope.notificationTemplate.contents[index])
        });

        console.log($scope.notificationTemplate.contents)

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

        setTimeout(() => {
            var editorId = "cdssEditor" + $scope.cdssEditors.length
            $scope.cdssEditors.push(new CdssAceEditor(editorId, "", $scope.cdssLibrary.id, $scope.cdssLibrary.uuid));
        }, 1000)
    }

    $scope.saveNotificationTemplate = saveNotificationTemplate
    $scope.newParameter = {}
    $scope.newTemplate = {}
    $scope.cdssLibrary = {}
    $scope.cdssEditors = []

    if ($stateParams.id) {
        $scope.isLoading = true;
    }
    initializeView($stateParams.id)
}]);