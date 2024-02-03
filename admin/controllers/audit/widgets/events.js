/// <reference path="../../../../core/js/santedb.js"/>
/*
 * Copyright (C) 2021 - 2024, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
 * Portions Copyright (C) 2015-2018 Mohawk College of Applied Arts and Technology
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
 * 
 * User: fyfej
 * Date: 2023-5-19
 */
angular.module('santedb').controller('AuditEventInformationController', ["$scope", function ($scope) {

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

     // Render the action column
     $scope.renderAction = function (audit) {

        var retVal = "";
        switch (audit.action) {
            case "Read":
                retVal = "<i class='fas fa-database text-success fa-fw'></i> ";
                break;
            case "Create":
            case "Update":
            case "Delete":
                retVal = "<i class='fas fa-database text-danger fa-fw'></i> ";
                break;
            case "Execute":
                retVal = "<i class='fas fa-play'></i> ";
                break;
        }
        retVal += audit.action;
        return retVal;
    }

}]);