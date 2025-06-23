/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../viewEditor.js"/>

angular.module('santedb').controller('NotificationsInstanceEditController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", "$interval", function ($scope, $rootScope, $state, $stateParams, $timeout, $interval) {

    const NotificationState_NotYetRun = "AC843892-F7E0-47B6-8F84-11C14E7E96C6";

    async function initializeView(id) {
        if (id !== undefined) {
            try {
                const notificationInstance = await SanteDB.resources.notificationInstance.getAsync(id, null, null, true);
                $timeout(() => {
                    document.title = document.title + " - " + notificationInstance.mnemonic;
                    $scope.notificationInstance = notificationInstance;
                    $scope.originalTemplate = notificationInstance.template;
                    $scope.createEditor();
                });
            } catch (e) {
                $rootScope.errorHandler(e);
            } finally {
                $scope.isLoading = false;
            }
        } else {
            $scope.notificationInstance = {
                $type: 'NotificationInstance',
                state: NotificationState_NotYetRun,
                filter: '',
                template: null,
                instanceParameter: [],
            }
            $scope.createEditor();
        }
    }

    $scope._editor = null;

    $scope.createEditor = function () {
        if (!$scope._editor) {
            const templateDefinitions = { views: [{ type: "div", content: $scope.notificationInstance.filter }] }
            var _needRefresh = false;
            $scope._editor = new ViewAceEditor("cdssEditor", templateDefinitions, "div");
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

            //Remove obsolete parameters.
            $scope.notificationInstance.instanceParameter = $scope.notificationInstance.instanceParameter.filter((ip) => ip._isObsolete !== true);

            $scope.notificationInstance.instanceParameter.forEach(parameter => {
                //Convert any templated parameters from changing the entity over to the instance parameter.
                if (parameter.$type == "NotificationTemplateParameter") {
                    parameter.$type = "NotificationInstanceParameter";
                    parameter.templateParameter = parameter.name
                    parameter.id = null;
                }
            });

            await SanteDB.resources.notificationInstance.updateAsync($stateParams.id, $scope.notificationInstance, true);

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

    if ($stateParams.id) {
        $scope.isLoading = true;
    }

    $scope.cdssLibrary = {}
    $scope.entityTypeMnemonic = ""
    $scope.selectedEntityId = "a52c43e0-dc6e-11ef-9551-a36f7144b253";
    $scope.notificationInstance = {};

    

    $scope.goToNewTemplate = async function () {
        $state.go("santedb-admin.notifications.templates.create")
    }

    $scope.onCancelClicked = async function () {
        $state.go("santedb-admin.notifications.instances.index");
    }

    $scope.$watch("notificationInstance.template", async function (n, o) {
        if (n != o && n) {
            const template = await SanteDB.resources.notificationTemplate.getAsync($scope.notificationInstance.template, null, null, true);
            $timeout(() => {
                if (template.id == $scope.originalTemplate) {
                    let instance = $scope.notificationInstance;

                    for (i = 0; i < instance.instanceParameter.length; i++) {
                        let templateParameter = template.parameters.find(p => p.name == instance.instanceParameter[i].templateParameter);
                        if (templateParameter != undefined) {
                            instance.instanceParameter[i].name = templateParameter.name;
                            instance.instanceParameter[i].description = templateParameter.description;
                        }
                        else{
                            //TODO: Notify that the parameter is invalid.
                            instance.instanceParameter[i].name = instance.instanceParameter[i].templateParameter;
                            instance.instanceParameter[i]._isObsolete = true;
                        }
                    }

                    let newParameters = template.parameters.filter(p => instance.instanceParameter.findIndex((ip) => ip.templateParameter === p.name) < 0);

                    newParameters.forEach((np) => {
                        instance.instanceParameter.push({
                            $type: "NotificationInstanceParameter",
                            name: np.name,
                            description: np.description,
                            templateParameter: np.name
                        });
                    });

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

    initializeView($stateParams.id);
}]);