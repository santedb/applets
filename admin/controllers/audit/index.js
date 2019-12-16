/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('AuditIndexController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {


    // Render the outcome
    $scope.renderOutcome = function (audit) {
        switch (audit.outcome) {
            case "Success":
                return `<span class='badge badge-success'><i class='fas fa-check'></i> ${SanteDB.locale.getString("ui.model.audit.state.success")}</span>`;
            case "MinorFail":
            case "SeriousFail":
                return `<span class='badge badge-warning'><i class='fas fa-info-circle'></i> ${SanteDB.locale.getString("ui.model.audit.state.warning")}</span>`;
            case "EpicFail":
                return `<span class='badge badge-danger'><i class='fas fa-exclamation-circle'></i> ${SanteDB.locale.getString("ui.model.audit.state.error")}</span>`;
            default:
                return audit.outcome;
        }
    };

    // Render the timestamp
    $scope.renderTimestamp = function (audit) {
        return moment(audit.timestamp).format('YYYY-MM-DD HH:mm:ss Z');
    }

    $scope.renderAction = function (audit) {
        return "todo";
    }

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

        return `<span class='badge ${color}'><i class='fas ${icon}'></i> ${audit.event}</span> ${audit.type.display}`
    }

    $scope.renderType = function (audit) {
        return "todo";
    }

    $scope.renderActor = function (audit) {
        if(audit.actor && audit.actor.length) return `<i class="fas fa-user"></i> ${audit.actor[0].uname}`;
        return "N/A"
    }
}]);