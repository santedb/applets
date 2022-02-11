/// <reference path="../../../core/js/santedb.js"/>
/*
 * Portions Copyright 2015-2019 Mohawk College of Applied Arts and Technology
 * Portions Copyright 2019-2019 SanteSuite Contributors (See NOTICE)
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you 
 * may not use this file except in compliance with the License. You may 
 * obtain a copy of the License at 
 * 
 * http://www.apache.org/licenses/LICENSE-2.0 
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the 
 * License for the specific language governing permissions and limitations under 
 * the License.
 */
angular.module('santedb').controller('ViewAuditController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", "$compile", '$timeout', function ($scope, $rootScope, $state, $templateCache, $stateParams, $compile, $timeout) {

    if ($stateParams.id) {
        SanteDB.resources.audit.getAsync($stateParams.id)
            .then ( r=> {
                $scope.isLoading = false;
                $scope.target = $scope.target || {};
                $scope.target.audit = r;

                if ($scope.target.audit.meta) {
                    $scope.target.audit.metaDisplay = {};
                    $scope.target.audit.meta.forEach((o) => $scope.target.audit.metaDisplay[o.key] = o.value);
                }
                if ($scope.target.audit.actor) {
                    $scope.target.audit.actorDisplay = {
                        "source": $scope.target.audit.actor.find((o) => o.role.find((r) => r.code == "110153")),
                        "destination": $scope.target.audit.actor.find((o) => o.role.find((r) => r.code == "110152")),
                    }
                }
                $scope.$apply();
            })
            .catch($rootScope.errorHandler);
    }

    // Render the outcome
    $scope.renderOutcome = function (audit) {
        switch (audit.outcome) {
            case "Success":
                return `<span class='badge badge-success'><i class='fas fa-check'></i> ${SanteDB.locale.getString("ui.model.audit.outcome.success")}</span>`;
            case "MinorFail":
                return `<span class='badge badge-warning'><i class='fas fa-info-circle'></i> ${SanteDB.locale.getString("ui.model.audit.outcome.warning")}</span>`;
            case "SeriousFail":
                return `<span class='badge badge-warning'><i class='fas fa-info-circle'></i> ${SanteDB.locale.getString("ui.model.audit.outcome.error")}</span>`;
            case "EpicFail":
                return `<span class='badge badge-danger'><i class='fas fa-exclamation-circle'></i> ${SanteDB.locale.getString("ui.model.audit.outcome.epic")}</span>`;
            default:
                return audit.outcome;
        }
    };
    
    // Transition
    $scope.navigate = function (state, params) {
        $scope.navPush = { state: state, params: params };
    }

    // Render the event column
    $scope.renderEvent = function (audit) {

        var icon = "fa-circle";
        var color = "badge-dark";

        switch (audit.event) {
            case "SecurityAlert":
                icon = 'fa-shield-alt';
                break;
            case "Query":
                icon = 'fa-search';
                color = 'badge-info';
                break;
            case "UseOfRestrictedFunction":
            case "EmergencyOverrideStarted":
                icon = "fa-user-shield";
                color = "badge-danger";
                break;
            case "UserAuthentication":
            case "Login":
            case "Logout":
                icon = "fa-user-lock";
                color = "badge-info";
                break;
            case "MedicationEvent":
            case "ProvisioningEvent":
            case "CareEpisode":
            case "CareProtocol":
            case "ProcedureRecord":
                icon = "fa-procedures";
                color = "badge-primary";
                break;
            case "NetowrkEntry":
                icon = "fa-network-wired";
                color = "badge-default";
                break;
            case "Import":
                icon = "fa-file-import";
                color = "badge-default";
                break;
            case "Export":
                icon = "fa-file-export";
                color = "badge-default";
                break;
            case "ApplicationActivity":
                icon = "fa-window-maximize";
                color = "badge-default";
                break;
        }

        return `<span class='badge ${color}'><i class='fas ${icon}'></i> ${audit.event}</span> ${audit.type.display || audit.type.code}`
    }

    $scope.renderType = function (audit) {
        return "todo";
    }

    $scope.navigateObject = function(type, id) {
        SanteDB.application.callResourceViewer(type, $state, { id: id });
    }
}]);