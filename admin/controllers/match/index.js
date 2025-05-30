/*
 * Copyright (C) 2021 - 2025, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Portions Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
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

/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('MatchConfigurationDashboardController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $templateCache, $stateParams, $timeout) {


    // Render holder patient
    $scope.renderModifiedOn = (r) => SanteDB.display.renderDate(r.meta.updatedTime || r.meta.creationTime);

    // Render status
    $scope.renderState = (r) => `<i class="text-${r.meta.status == "Active" ? 'success' : 'danger'} fas fa-fw fa-circle"></i> ${r.meta.status}`;

    // Download
    $scope.download = (r) =>
        window.open(`/ami/MatchConfiguration/${r}/html`);

        
    // Download
    $scope.downloadXml = (r) =>
        window.open(`/ami/MatchConfiguration/${r}/xml`);

    // Initialize the view
    async function initializeView() {
        try {
            var jobStatus = await SanteDB.resources.jobInfo.findAsync({ name: "Background Matching Job" });
            var currentMatchJob = jobStatus.resource.find(o => o.state == "Running");
            $timeout(_ => {
                $scope.currentMatching = currentMatchJob;
            })
        }
        catch (e) {

        }
    }

    initializeView();

    // Update the configuration
    async function updateConfiguration(id, state) {
        try {
            await SanteDB.resources.matchConfiguration.invokeOperationAsync(id, "state", { state: state });
            $("div[type=MatchConfiguration] table").DataTable().ajax.reload()
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    // Enable the specified configuration
    $scope.enable = async function (id, m) {
        if (confirm(SanteDB.locale.getString("ui.admin.matches.config.enable.confirm", { id: id }))) {
            try {
                SanteDB.display.buttonWait(`#MatchConfigurationenable${m}`, true);
                await updateConfiguration(id, true);
                toastr.success(SanteDB.locale.getString("ui.admin.matches.config.enable.success", { id: id }));
            }
            catch (e) {
                toastr.error(SanteDB.locale.getString("ui.admin.matches.config.enable.error", { id: id, e: e.message }));
            }
            finally {
                SanteDB.display.buttonWait(`#MatchConfigurationenable${m}`, false);
            }
        }
    }

    // Disable the specified configuration
    $scope.disable = async function (id, m) {
        if (confirm(SanteDB.locale.getString("ui.admin.matches.config.disable.confirm", { id: id }))) {
            try {
                SanteDB.display.buttonWait(`#MatchConfigurationdisable${m}`, true);
                await updateConfiguration(id, false);
                toastr.success(SanteDB.locale.getString("ui.admin.matches.config.disable.success", { id: id }));
            }
            catch (e) {
                toastr.error(SanteDB.locale.getString("ui.admin.matches.config.disable.error", { id: id, e: e.message }));
            }
            finally {
                SanteDB.display.buttonWait(`#MatchConfigurationdisable${m}`, false);
            }
        }
    }

    // Delete the specified configuration
    $scope.delete = async function (id, m) {
        if (confirm(SanteDB.locale.getString("ui.admin.matches.config.delete.confirm", { id: id }))) {
            try {
                SanteDB.display.buttonWait(`#MatchConfigurationdelete${m}`, true);
                await SanteDB.resources.matchConfiguration.deleteAsync(id);
                toastr.success(SanteDB.locale.getString("ui.admin.matches.config.delete.success", { id: id }));
                $("div[type=MatchConfiguration] table").DataTable().ajax.reload()
            }
            catch (e) {
                toastr.error(SanteDB.locale.getString("ui.admin.matches.config.delete.error", { id: id, e: e.message }));
            }
            finally {
                SanteDB.display.buttonWait(`#MatchConfigurationdelete${m}`, false);
            }
        }
    }

    // Clone a configuration
    $scope.clone = async function (id, m) {
        try {
            SanteDB.display.buttonWait(`#MatchConfigurationclone${m}`, true);
            var config = await SanteDB.resources.matchConfiguration.getAsync(id);
            config.meta.status = 'Inactive';
            config.id = config.id + '-clone';
            delete (config.uuid);
            config.$type = 'MatchConfiguration';

            try {
                var existing = await SanteDB.resources.matchConfiguration.getAsync(config.id, true);
                if (!confirm(SanteDB.locale.getString("ui.admin.matches.config.save.overwrite", { id: existing.id, author: existing.meta.createdBy }))) {
                    return;
                }
            }
            catch (e) { }
            await SanteDB.resources.matchConfiguration.insertAsync(config, true);

            toastr.success(SanteDB.locale.getString("ui.admin.matches.config.clone.success", { id: id }));
            $("div[type=MatchConfiguration] table").DataTable().ajax.reload()
        }
        catch (e) {
            toastr.error(SanteDB.locale.getString("ui.admin.matches.config.clone.error", { id: id, e: e.message }));
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait(`#MatchConfigurationclone${m}`, false);
        }
    }
}])