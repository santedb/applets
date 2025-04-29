/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../../../../bicore/js/santedb-bi.js"/>
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
angular.module('santedb').controller('EditConceptSetController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $stateParams, $timeout) {

    async function checkDuplicate(query) {
        try {
            query._count = 0;
            query._includeTotal = true;
            var duplicate = await SanteDB.resources.conceptSet.findAsync(query);
            return duplicate.totalResults > 0;
        }
        catch (e) {
            console.warn(e);
            return false;
        }
    }

    // Initialize the view
    async function initializeView(id) {
        try {
            var conceptSet = await SanteDB.resources.conceptSet.getAsync(id, "concept");
            var formats = await SanteDBBi.resources.format.findAsync();
            $timeout(() => {
                $scope.conceptSet = conceptSet;
                $scope.formats = formats.resource;
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    // Save code system
    async function saveConceptSet(conceptSetForm) {
        if (conceptSetForm.$invalid) return;

        try {
            SanteDB.display.buttonWait("#saveConceptSetButton", true);
            // Update
            var conceptSet = null;
            if ($stateParams.id) {
                conceptSet = await SanteDB.resources.conceptSet.updateAsync($stateParams.id, $scope.conceptSet);
            }
            else {
                conceptSet = await SanteDB.resources.conceptSet.insertAsync($scope.conceptSet);
            }

            toastr.success(SanteDB.locale.getString("ui.admin.conceptSet.save.success"));

            if (!$stateParams.id) {
                $state.go("santedb-admin.concept.conceptSet.view", { id: conceptSet.id });
            }
            else {
                $timeout(() => $scope.conceptSet = conceptSet);
            }
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveConceptSetButton", false);
        }
    }

    // Initialize view for load or create
    if ($stateParams.id) {
        initializeView($stateParams.id);
    }
    else {
        $scope.conceptSet = new ConceptSet();
        $scope.$watch("conceptSet.mnemonic", async function (n, o) {
            if (n != o && n && n.length > 1) {
                var valid = !await checkDuplicate({ mnemonic: n });
                $timeout(() => $scope.createConceptSetForm.conceptSetMnemonic.$setValidity('duplicate', valid));
            }
        });

        $scope.$watch("conceptSet.oid", async function (n, o) {
            if (n != o && n && n.length > 1) {
                var valid = !await checkDuplicate({ oid: n });
                $timeout(() => $scope.createConceptSetForm.conceptSetOid.$setValidity('duplicate', valid));
            }
        });

        $scope.$watch("conceptSet.url", async function (n, o) {
            if (n != o && n && n.length > 1) {
                var valid = !await checkDuplicate({ url: n });
                $timeout(() => $scope.createConceptSetForm.conceptSetUrl.$setValidity('duplicate', valid));
            }
        });

    }
    // Bind to scope
    $scope.saveConceptSet = saveConceptSet;

    // Download code system
    $scope.downloadConceptSet = function (id) {
        var win = window.open(`/hdsi/ConceptSet/${id}/_export?_include=Concept:conceptSet%3d${id}%26_exclude=conceptSet%26_exclude=referenceTerm&_includesFirst=true&_include=ConceptSet:compose.source=${id}%26_exclude=concept`, '_blank');
        win.onload = function (e) {
            win.close();
        };
    }

    $scope.exportConceptSet = function (format) {

        var parms = jQuery.param({ "set-id": $stateParams.id })
        var win = window.open(`/bis/Report/${format}/org.santedb.bi.core.reports.concept.set?${parms}&_view=table&_download=true`, '_blank');
        win.onload = function (e) {
            //win.close();
        };

    }
}]);
