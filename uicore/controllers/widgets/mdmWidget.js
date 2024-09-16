/// <reference path="../../.ref/js/santedb.js"/>
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
 */
angular.module('santedb').controller('MasterDataManagementController', ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {

    // Strength
    $scope.renderStrength = function (entity) {
        return entity.tag["$match.score"] ? entity.tag["$match.score"][0] : "?";
    }

    // Render entity information
    $scope.renderEntityInfo = function (entity) {

        return SanteDB.display.renderPatientAsString(entity, SanteDB.configuration.getAppSetting('aa.preferred'));

    }

    // Render entity information
    $scope.renderCreatedBy = function (entity) {
        return `<provenance provenance-id="'${entity.createdBy}'" application-provenance="true"  provenance-time="'${entity.creationTime}'"></provenance>`;
    }

    // Render classification concept
    $scope.renderClassificationConcept = function(entity) {
        if(entity.tag && entity.tag["$mdm.relationship.class"]) {
            switch(entity.tag["$mdm.relationship.class"][0]) {
                case "Auto":
                    return "<i class='fas fa-magic'></i> Auto";
                case "System":
                    return "<i class='fas fa-cogs'></i> System";
                case "Verified":
                    return "<i class='fas fa-check-circle'></i> Verified";
            }
        }
        else {
            return "<i class='fas fa-question-circle'></i>";
        }
    }

    // Show match detail
    $scope.matchDetail = async function (id) {
        try {
            $timeout(() => {
                delete($scope.scopedObject.candidateObject);
                $("#candidateDetailModal").modal('show');
            });
            delete ($scope.candidateObject);
            var matchReport = await SanteDB.resources.patient.getAssociatedAsync($scope.scopedObject.id, "match-candidate", id, { _upstream: true });

            $timeout(_ => {
                $scope.scopedObject.candidateObject = {
                    results: matchReport.results
                };
            });

        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    /**
     * Submit an "ignore" request for the specified relationship
     */
    $scope.ignore = async function (id, m) {
        try {

            SanteDB.display.buttonWait(`#Patientignore${m}`, true);
            await ignoreCandidateAsync(id, $scope.scopedObject.id);
            $("div[type=Patient] table").DataTable().ajax.reload()
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait(`#Patientignore${m}`, false);
        }
    }

    /**
     * Submit an "un-ignore" request for the specified relationship
     */
     $scope.ignore = async function (id, m) {
        try {

            SanteDB.display.buttonWait(`#Patientignore${m}`, true);
            await ignoreCandidateAsync(id, $scope.scopedObject.id);
            $("div[type=Patient] table").DataTable().ajax.reload()
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait(`#Patientignore${m}`, false);
        }
    }

    /**
     * Submit a RESOLVE 
     */
    $scope.resolve = async function (id, m) {
        try {

            SanteDB.display.buttonWait(`#Patientresolve${m}`, true);
            await attachCandidateAsync($scope.scopedObject.id, id);
            $("div[type=Patient] table").DataTable().ajax.reload()
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait(`#Patientesolve${m}`, false);
        }
    }

    /**
     * Detatch the record
     */
    $scope.detach = async function (id, m) {
        try {

            SanteDB.display.buttonWait(`#Patientunlink${m}`, true);
            await detachLocalAsync($scope.scopedObject.id, id);
            $("div[type=Patient] table").DataTable().ajax.reload()
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait(`#Patientunlink${m}`, false);
        }
    }

    /**
     * Re-match a record
     */
    $scope.rematch = async function () {
        try {
            SanteDB.display.buttonWait('#Patientrematch', true);

            if (!confirm(SanteDB.locale.getString("ui.admin.matches.rematch.confirm"))) {
                return;
            }

            var result = await SanteDB.resources.patient.invokeOperationAsync($scope.scopedObject.id, "match", { clear: true }, true);

            $("div[type=Patient] table").DataTable().ajax.reload()

        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait('#Patientrematch', false);
        }
    }

    /**
     * Submit an "un-ignore" request for the specified relationship
     */
     $scope.unIgnore = async function (id, m) {
        try {

            SanteDB.display.buttonWait(`#Patientunignore${m}`, true);
            await unIgnoreCandidateAsync(id, $scope.scopedObject.id);
            $("div[type=Patient] table").DataTable().ajax.reload()
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait(`#Patientunignore${m}`, false);
        }
    }
}]);