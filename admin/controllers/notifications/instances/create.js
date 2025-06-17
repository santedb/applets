/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../viewEditor.js"/>

angular.module('santedb').controller('NewNotificationController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $stateParams, $timeout) {

    async function initializeView() {
        $scope.notificationInstance = {
            $type: 'NotificationInstance',
            state: 'AC843892-F7E0-47B6-8F84-11C14E7E96C6',
            filter: '',
            template: null,
            instanceParameter: [],
        }

        $scope.createEditor();
    }

    $scope.templateDefinitions = { views: [{ type: "div", content: "" }] }
    $scope._editor = null;

    $scope.createEditor = function () {
        if (!$scope._editor) {
            var _needRefresh = false;

            $scope._editor = new ViewAceEditor("cdssEditor", $scope.templateDefinitions, "div");
            $scope._editor.onChange(() => {
                _needRefresh = true;
                $scope.notificationInstanceForm.$setDirty();
                $scope.notificationInstance.filter = $scope._editor.getValue();
            });
            validateInterval = setInterval(() => {
                if (_needRefresh) {
                    _needRefresh = false;
                }
            }, 5000);
            $scope.$on('$destroy', function (s) {
                clearInterval(validateInterval);
            });
            $scope._editor.onSave(() => $scope.notificationInstanceForm.$setPristine());
        }
    }

    $scope.saveNotificationInstance = async function (notificationInstanceForm, event) {
        if (notificationInstanceForm.$invalid) return;

        try {
            SanteDB.display.buttonWait("#saveNotificationInstanceButton", true);
            SanteDB.display.buttonWait("#cancelNotificationInstanceButton", true);

            $scope.notificationInstance.instanceParameter.forEach(parameter => {
                parameter.$type = "NotificationInstanceParameter";
                parameter.templateParameter = parameter.id
                parameter.id = null;
            });

            await SanteDB.resources.notificationInstance.insertAsync($scope.notificationInstance, true);

            toastr.success(SanteDB.locale.getString("ui.admin.notifications.instance.save.success"));

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

    $scope.onCancelClicked = async function () {
        $state.go("santedb-admin.notifications.instances.index");
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
}]);