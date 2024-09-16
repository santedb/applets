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
angular.module('santedb').controller('DataQualityIndexController', ["$scope", function ($scope) {

    $scope.renderEnabled = (r) => {
        if(r.enabled) {
            return '<span class="text-success"><i class="fas fa-check"></i> {{ "ui.state.active" | i18n }}</span>';
        }
        else {
            return '<span class="text-danger"><i class="fas fa-times"></i> {{ "ui.state.inactive" | i18n }}</span>';
        }
    }

    $scope.renderResources = (r) => r.resources.map(o=>o.resource).join(", ");

    $scope.delete = async function(id) {
        if(confirm(SanteDB.locale.getString("ui.admin.dataQuality.delete.confirm"))) {
            try {
                await SanteDB.resources.dataQuality.deleteAsync(id, true);
                $("#DataQualityRuleTable").attr("newQueryId", true);
                $("#DataQualityRuleTable table").DataTable().ajax.reload();
                toastr.success(SanteDB.locale.getString("ui.admin.dataQuality.delete.success"));
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.dataQuality.delete.error", { error: e.message }));
            }
        }
    }

    $scope.download = function(id) {
        window.open(`/ami/DataQualityRulesetConfiguration/${id}?_format=xml&_upstream=true`);
    }

    $scope.restore = async function(id) {
        if(confirm(SanteDB.locale.getString("ui.admin.dataQuality.restore.confirm"))) {
            try {
                var dq = await SanteDB.resources.dataQuality.getAsync(id, null, null, true);
                dq.obsoletionTime = null;
                dq.obsoletedBy = null;
                dq.enabled =false;
                await SanteDB.resources.dataQuality.updateAsync(id, dq, true);
                $("#DataQualityRuleTable").attr("newQueryId", true);
                $("#DataQualityRuleTable table").DataTable().ajax.reload();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.dataQuality.restore.error", { error: e.message }));
            }
        }
    }

    $scope.purge = async function(id) {
        if(confirm(SanteDB.locale.getString("ui.admin.dataQuality.purge.confirm"))) {
            try {
                await SanteDB.resources.dataQuality.deleteAsync(id, true);
                $("#DataQualityRuleTable").attr("newQueryId", true);
                $("#DataQualityRuleTable table").DataTable().ajax.reload();
                toastr.success(SanteDB.locale.getString("ui.admin.dataQuality.purge.success"));
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.dataQuality.purge.error", { error: e.message }));
            }

        }
    }
}]);
