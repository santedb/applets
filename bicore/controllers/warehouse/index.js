/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../js/santedb-bi.js"/>

angular.module('santedb').controller('WarehouseController', ["$scope", "$rootScope", "$state", "$timeout", function ($scope, $rootScope, $state, $timeout) {


    $scope.fetchMartState = async function (r) {

        try {
            // Attempt to fetch the item status
            r.deployed = await SanteDBBi.resources.warehouse.getAsync(r.id);
        }
        catch (e) {
        }
        return r;
    }

    $scope.renderDescription = function (r) {
        if (r.meta && r.meta.doc) {
            var docEl = $(r.meta.doc.doc);
            return `${$(docEl).text().trim().substr(0, 100)}...`;
        }
    }

    $scope.renderAuthor = function (r) {
        if (r.meta && r.meta.authors) {
            return r.meta.authors.join(",");
        }
    }

    $scope.renderRegistrationControl = function (r) {
        if (r.deployed) {
            var retVal = "";
            if (r.deployed.exec && r.deployed.exec.length > 0) { // has been run

                var time = moment(r.deployed.exec[0].finished || new Date()).diff(r.deployed.exec[0].started, "second");
                switch (r.deployed.exec[0].outcome) {
                    case "Fail":
                        retVal += `<span class='badge badge-danger'><i class='fas fa-exclamation-circle'></i> failed (${time} s)</span>`;
                        break;
                    case "PartialSuccess":
                        retVal += `<span class='badge badge-warning'><i class='fas fa-info-circle'></i> partial-failure (${time} s)</span>`;
                        break;
                    case "Success":
                        retVal += `<span class='badge badge-success'><i class='fas fa-check-circle'></i> success (${time} s)</span>`;
                        break;
                    case "Unknown":
                        retVal += `<span class='badge badge-info'><i class='fas fa-play'></i> running (${time} s)</span>`;
                        break;
                }

                retVal += ` @ ${SanteDB.display.renderDate(moment(r.deployed.exec[0].finished || r.deployed.exec[0].started))}`;

            }
            else {
                retVal = `{{ 'ui.bi.marts.registered' | i18n }}`;
            }
            return retVal;
        }
        else {
            return `{{ 'ui.bi.marts.unregistered' | i18n }}`;
        }
    }

    $scope.register = async function (id, index) {
        if (confirm(SanteDB.locale.getString('ui.bi.marts.register.confirm', { id: id }))) {
            try {
                SanteDB.display.buttonWait(`#BiDatamartDefinitionregister${index}`, true);
                await SanteDBBi.resources.datamart.invokeOperationAsync(id, "register");
                $("#dataMartTable table").DataTable().ajax.reload();~
                toastr.success(SanteDB.locale.getString("ui.bi.marts.register.success", {id: id}));
            }
            catch (e) {
                $rootScope.errorHandler(e);
                toastr.error(SanteDB.locale.getString("ui.bi.marts.register.fail", { id: id, e: e.message }));

            }
            finally {
                SanteDB.display.buttonWait(`#BiDatamartDefinitionregister${index}`, false);
            }
        }
    }

    $scope.unregister = async function (id, index) {
        if (confirm(SanteDB.locale.getString('ui.bi.marts.unregister.confirm', { id: id }))) {
            try {

                SanteDB.display.buttonWait(`#BiDatamartDefinitionunregister${index}`, true);
                await SanteDBBi.resources.datamart.invokeOperationAsync(id, "unregister");
                $("#dataMartTable table").DataTable().ajax.reload();
                toastr.success(SanteDB.locale.getString("ui.bi.marts.unregister.success", {id: id}));

            }
            catch (e) {
                $rootScope.errorHandler(e);
                toastr.error(SanteDB.locale.getString("ui.bi.marts.unregister.fail", { id: id, e: e.message }));
            }
            finally {
                SanteDB.display.buttonWait(`#BiDatamartDefinitionunregister${index}`, false);
            }
        }
    }

}]);