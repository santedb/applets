/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../../cdss/codeEditor.js"/>

angular.module('santedb').controller('NewNotificationController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $stateParams, $timeout) {

    async function initializeView() {
        $scope.notificationInstance = {
            $type: 'NotificationInstance',
            state: 'AC843892-F7E0-47B6-8F84-11C14E7E96C6',
            filter: '',
            template: null,
            instanceParameter: [],
        }

        const libraryDefinition = await SanteDB.resources.cdssLibraryDefinition.getAsync(null, null, null, true, { "oid": "1.3.6.1.4.1.52820.5.1.5.9.1" });
        $timeout(() => {
            $scope.cdssLibrary = libraryDefinition.resource[0].library;
        });

        $scope.cdssEditor = new CdssAceEditor("cdssEditor", $scope.notificationInstance.filter, $scope.cdssLibrary.id, $scope.cdssLibrary.uuid);
    }

    $scope.saveNotificationInstance = async function (notificationInstanceForm, event) {
        if (notificationInstanceForm.$invalid) return;

        $scope.notificationInstance.filter = document.getElementById("cdssEditor").innerText;

        console.log($scope.notificationInstance)

        try {
            SanteDB.display.buttonWait("#saveNotificationInstanceButton", true);
            SanteDB.display.buttonWait("#cancelNotificationInstanceButton", true);

            $scope.notificationInstance.instanceParameter.forEach(parameter => {
                parameter.$type = "NotificationInstanceParameter";
                parameter.templateParameter = parameter.id
                parameter.id = null;
            });

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

    $scope.goToNewTemplate = async function () {
        $state.go("santedb-admin.notifications.templates.create")
    }

    $scope.cdssLibrary = {}
    $scope.entityTypeLabel = ""
    $scope.entityTypeMnemonic = ""
    $scope.selectedEntityId = null;

    initializeView()

    $scope.$watch("notificationInstance.template", async function (n, o) {
        if (n != o && n) {
            const template = await SanteDB.resources.notificationTemplate.getAsync($scope.notificationInstance.template, null, null, true)

            $timeout(() => {
                $scope.notificationInstance.instanceParameter = template.parameters
            })
        }
    })

    $scope.retrieveEntityLabel = async function () {
        const entityLabel = await SanteDB.resources.concept.getAsync($scope.notificationInstance.entityType, null, null, true)
        $timeout(() => {
            $scope.entityTypeLabel = entityLabel.name.en[0]
            $scope.entityTypeMnemonic = entityLabel.mnemonic
        })
    }

    $scope.validateCriteria = function () {
        console.log("validate criteria")
    }

    $scope.sendNotification = function () {
        console.log("send notification")
    }
}]);