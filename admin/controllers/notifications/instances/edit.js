/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../../cdss/codeEditor.js"/>

angular.module('santedb').controller('NotificationsInstanceEditController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", "$interval", function ($scope, $rootScope, $state, $stateParams, $timeout, $interval) {
    
    async function initializeView(id) {
        if (id !== undefined) {
            try {
                const notificationInstance = await SanteDB.resources.notificationInstance.getAsync(id, "full", null, true, null);
                setTimeout(() => {
                    $scope.notificationInstance = notificationInstance;
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

        const libraryDefinition = await SanteDB.resources.cdssLibraryDefinition.getAsync(null, null, null, true, { "oid": "1.3.6.1.4.1.52820.5.1.5.9.1" });
        $timeout(() => {
            $scope.cdssLibrary = libraryDefinition.resource[0].library;
        });
        
        $scope.cdssEditor = new CdssAceEditor("cdssEditor", $scope.notificationInstance.filter, $scope.cdssLibrary.id, $scope.cdssLibrary.uuid);
    }
    
    $scope.saveNotificationInstance = async function(notificationInstanceForm, event) {
        if (notificationInstanceForm.$invalid) return;

        $scope.notificationInstance.filter = document.getElementById("cdssEditor").innerText;

        try {
            SanteDB.display.buttonWait("#saveNotificationInstanceButton", true);
            SanteDB.display.buttonWait("#cancelNotificationInstanceButton", true);

            $scope.notificationInstance.instanceParameter.forEach(parameter => {
                if(parameter.$type == "NotificationTemplateParameter") {
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

    if($stateParams.id) {
        $scope.isLoading = true;
    }

    $scope.cdssLibrary = {}


    initializeView($stateParams.id);

    $scope.goToNewTemplate = async function() {
        $state.go("santedb-admin.notifications.templates.create")
    }

    $scope.$watch("notificationInstance.template", async function(n, o) {
        if(n != o && n) {
            const template = await SanteDB.resources.notificationTemplate.getAsync($scope.notificationInstance.template, null, null, true);

            if(template.id == $scope.originalTemplate) {
                for(i = 0; i < $scope.notificationInstance.instanceParameter.length; i++) {
                    let templateParameter = template.parameters.find(p => p.id == $scope.notificationInstance.instanceParameter[i].templateParameter);
                    if(templateParameter != undefined) {
                        $scope.notificationInstance.instanceParameter[i].name = templateParameter.name;
                        $scope.notificationInstance.instanceParameter[i].description = templateParameter.description;
                    }
                }
            } else {
                $scope.notificationInstance.instanceParameter = template.parameters;
            }
        }
    })
}]);