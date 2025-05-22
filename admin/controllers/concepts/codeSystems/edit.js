/// <reference path="../../../../core/js/santedb.js"/>
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
angular.module('santedb').controller('EditCodeSystemController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $stateParams, $timeout) {

    async function checkDuplicate(query) {
        try {
            query._count = 0;
            query._includeTotal = true;
            var duplicate = await SanteDB.resources.codeSystem.findAsync(query);
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
            var codeSystem = await SanteDB.resources.codeSystem.getAsync(id, "concept");
            $timeout(() => $scope.codeSystem = codeSystem);
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    // Save code system
    async function saveCodeSystem(codeSystemForm) {
        if (codeSystemForm.$invalid) return;

        try {
            SanteDB.display.buttonWait("#saveCodeSystemButton", true);
            // Update
            var codeSystem = null;
            if ($stateParams.id) {
                codeSystem = await SanteDB.resources.codeSystem.updateAsync($stateParams.id, $scope.codeSystem);
            }
            else {
                codeSystem = await SanteDB.resources.codeSystem.insertAsync($scope.codeSystem);
            }

            toastr.success(SanteDB.locale.getString("ui.admin.codeSystem.save.success"));

            if (!$stateParams.id) {
                $state.go("santedb-admin.concept.codeSystem.view", { id: codeSystem.id });
            }
            else {
                $timeout(() => $scope.codeSystem = codeSystem);
            }
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveCodeSystemButton", false);
        }
    }

    // Initialize view for load or create
    if ($stateParams.id) {
        initializeView($stateParams.id);
    }
    else {
        $scope.codeSystem = new CodeSystem();
        $scope.$watch("codeSystem.authority", async function (n, o) {
            if (n != o && n && n.length > 1) {
                var valid = !await checkDuplicate({ authority: n });
                $timeout(() => $scope.createCodeSystemForm.codeSystemAuthority.$setValidity('duplicate', valid));
            }
        });
    
        $scope.$watch("codeSystem.oid", async function (n, o) {
            if (n != o && n && n.length > 1) {
                var valid = !await checkDuplicate({ oid: n });
                $timeout(() => $scope.createCodeSystemForm.codeSystemOid.$setValidity('duplicate', valid));
            }
        });
    
        $scope.$watch("codeSystem.url", async function (n, o) {
            if (n != o && n && n.length > 1) {
                var valid = !await checkDuplicate({ url: n });
                $timeout(() => $scope.createCodeSystemForm.codeSystemUrl.$setValidity('duplicate', valid));
            }
        });
    
    }
    // Bind to scope
    $scope.saveCodeSystem = saveCodeSystem;

    // Download code system
    $scope.downloadCodeSystem = function(id) {
        var win = window.open(`/hdsi/CodeSystem/${id}/_export?_include=ReferenceTerm:codeSystem%3d${id}&_include=Concept:referenceTerm.term.codeSystem%3d${id}%26_exclude=relationship%26_exclude=conceptSet%26_exclude=referenceTerm&_include=ConceptReferenceTerm:term.codeSystem%3d${id}`, '_blank');
        win.onload = function (e) {
            win.close();
        };
    }
}]);
