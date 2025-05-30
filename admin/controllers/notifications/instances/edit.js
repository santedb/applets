/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../viewEditor.js"/>

angular.module('santedb').controller('NotificationsInstanceEditController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", "$interval", function ($scope, $rootScope, $state, $stateParams, $timeout, $interval) {

    async function initializeView(id) {
        if (id !== undefined) {
            try {
                const notificationInstance = await SanteDB.resources.notificationInstance.getAsync(id, null, null, true);
                $timeout(() => {
                    $scope.notificationInstance = notificationInstance;
                    $scope.templateDefinitions.views[0].content = notificationInstance.filter;
                    $scope.originalTemplate = notificationInstance.template;
                })
            } catch (e) {
                $rootScope.errorHandler(e);
            } finally {
                $scope.isLoading = false;
            }
        } else {
            $scope.notificationInstance = {
                $type: 'NotificationInstance',
                state: 'AC843892-F7E0-47B6-8F84-11C14E7E96C6',
                filter: '',
                template: null,
                instanceParameter: [],
            }
        }

        $scope.createEditor();
    }

    $scope.templateDefinitions = { views: [{ type: "div", content: "" }] }
    $scope._editor = null;

    $scope.createEditor = function () {
        if (!$scope._editor) {
            console.log($scope.templateDefinitions)
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
                if (parameter.$type == "NotificationTemplateParameter") {
                    parameter.$type = "NotificationInstanceParameter";
                    parameter.templateParameter = parameter.id
                    parameter.id = null;
                }
            });

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

    if ($stateParams.id) {
        $scope.isLoading = true;
    }

    $scope.cdssLibrary = {}
    $scope.entityTypeMnemonic = ""
    $scope.selectedEntityId = "a52c43e0-dc6e-11ef-9551-a36f7144b253";

    initializeView($stateParams.id);

    $scope.goToNewTemplate = async function () {
        $state.go("santedb-admin.notifications.templates.create")
    }

    $scope.$watch("notificationInstance.template", async function (n, o) {
        if (n != o && n) {
            const template = await SanteDB.resources.notificationTemplate.getAsync($scope.notificationInstance.template, null, null, true);
            $timeout(() => {
                if (template.id == $scope.originalTemplate) {
                    for (i = 0; i < $scope.notificationInstance.instanceParameter.length; i++) {
                        let templateParameter = template.parameters.find(p => p.id == $scope.notificationInstance.instanceParameter[i].templateParameter);
                        if (templateParameter != undefined) {
                            $scope.notificationInstance.instanceParameter[i].name = templateParameter.name;
                            $scope.notificationInstance.instanceParameter[i].description = templateParameter.description;
                        }
                    }
                } else {
                    $scope.notificationInstance.instanceParameter = template.parameters;
                }
            })

        }
    })

    $scope.retrieveEntityLabel = async function () {
        const entityLabel = await SanteDB.resources.concept.getAsync($scope.notificationInstance.entityType, null, null, true)
        $timeout(() => {
            $scope.entityTypeLabel = entityLabel.name.en[0] || "Entity"
            $scope.entityTypeMnemonic = entityLabel.mnemonic
        })
    }

    $scope.validateCriteria = async function () {
        $scope.testNotificationResult = null;
        $scope.testEntity = null;
        try {
            const validationResult = await SanteDB.resources.notificationInstance.invokeOperationAsync($stateParams.id, "validate-notification", null, true);
            const entity = await SanteDB.resources.concept.getAsync($scope.notificationInstance.entityType, null, null, true)

            $scope.testEntity = {
                id: entity.id,
                name: entity.mnemonic
            }

            $timeout(() => {
                $scope.testNotificationResult = validationResult;
                $scope.testNotificationSuccessful = true;
            })
        } catch {
            $timeout(() => {
                $scope.testNotificationSuccessful = false;
                $scope.testNotificationResult = { text: 'ui.admin.notifications.instance.test.validate.error' }
            })
        }
    }

    $scope.sendNotification = async function () {
        $scope.testNotificationResult = null;
        $scope.testEntity = null;
        try {
            const testNotificationResult = await SanteDB.resources.notificationInstance.invokeOperationAsync($stateParams.id, "test-send-notification", { selectedEntity: $scope.selectedEntityId, entityType: $scope.notificationInstance.entityType }, true);
            $timeout(() => {
                $scope.testNotificationResult = testNotificationResult;
                $scope.testNotificationSuccessful = true;
            })
        } catch {
            $timeout(() => {
                $scope.testNotificationSuccessful = false;
                $scope.testNotificationResult = { text: 'ui.admin.notifications.instance.test.sending.error' }
            })
        }        
    }
}]);