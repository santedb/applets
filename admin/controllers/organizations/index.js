/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
angular.module('santedb').controller('OrganizationIndexController', ["$scope", "$rootScope", "$state", function ($scope, $rootScope, $state) {


    /**
    * @summary Render updated by
    */
    $scope.renderUpdatedBy = function (org) {
        return `<provenance provenance-id="'${org.createdBy}'" provenance-time="'${org.creationTime}'"></provenance>`;
    }

    /**
     * @summary Render the type concept
     */
    $scope.renderTypeConcept = function (org) {
        return SanteDB.display.renderConcept(org.typeConceptModel);
    }

    /**
     * @summary Render type of organization
     */
    $scope.renderIndustryConcept = function (org) {
        return SanteDB.display.renderConcept(org.industryConceptModel);
    }

    /**
     * @summary Render class of organization
     */
    $scope.renderClassConcept = function (org) {
            return SanteDB.display.renderConcept(org.classConceptModel);
    }

    /**
     * @summary Render entity name
     */
    $scope.renderName = function (org) {
        return SanteDB.display.renderEntityName(org.name, 'OfficialRecord');
    }

    $scope.renderAddress = function (org) {
        return SanteDB.display.renderEntityAddress(org.address);
    }

    $scope.renderStatusConcept = function (org) {
        return SanteDB.display.renderStatus(org.statusConcept);
    }

    /**
     * 
     * @param {*} id The id of the organization to delete / obsolete
     * @param {*} index The index of the organization
     */
    $scope.delete = async function (id, index) {

        var data = $("#OrganizationTable table").DataTable().row(index).data();

        if (data.obsoletionTime == null && confirm(SanteDB.locale.getString("ui.admin.organization.confirmDelete"))) {
            try {
                $("#action_grp_" + index + " a").addClass("disabled");
                $("#action_grp_" + index + " a i.fa-trash").removeClass("fa-trash").addClass("fa-circle-notch fa-spin");
                await SanteDB.resources.organization.deleteAsync(id);
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
            finally {
                $("#OrganizationTable").attr("newQueryId", true);
                $("#OrganizationTable table").DataTable().draw();
            }

        }
        else if (data.obsoletionTime != null && confirm(SanteDB.locale.getString("ui.admin.organization.confirmUnDelete"))) {
            $("#action_grp_" + index + " a").addClass("disabled");
            $("#action_grp_" + index + " a i.fa-trash-restore").removeClass("fa-trash-restore").addClass("fa-circle-notch fa-spin");
            try {
                await SanteDB.resources.organization.touchAsync(id);

            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
            finally {
                $("#OrganizationTable").attr("newQueryId", true);
                $("#OrganizationTable table").DataTable().draw();
            }

        }

    }

    // Download as a organization
    $scope.download = async function () {
        if (confirm(SanteDB.locale.getString("ui.action.export.confirm"))) {
            try {

                window.location = `/hdsi/Organization/_export?classConcept=!ff34dfa7-c6d3-4f8b-bc9f-14bcdc13ba6c&statusConcept=${StatusKeys.Active}`;
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
        
        }
    }

    
}]);