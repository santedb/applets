/// <reference path="../../core/js/santedb.js"/>
/// <reference path="../../core/js/santedb-model.js"/>
/*
 * Copyright 2015-2018 Mohawk College of Applied Arts and Technology
 *
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
 * User: justin
 * Date: 2018-11-14
 */

angular.module('santedb').controller('AdminLayoutController', ["$scope", "$rootScope", "$state", "$templateCache", function ($scope, $rootScope, $state, $templateCache) {

    initializeSideNavTriggers();
    
    // Shows the elevation dialog, elevates and then refreshes the state
    $scope.overrideRefresh = function() {
        new SanteDBElevator(
            function() {
                $templateCache.removeAll();
                $state.reload();
            }
        ).elevate($rootScope.session);
    }
    
    $("#logoutModal").on("hidden.bs.modal", function() {
        if(!window.sessionStorage.getItem("token"))
        {
            $templateCache.removeAll();
            $state.transitionTo('login'); 
        }
    });

    // abandon session
    $scope.abandonSession = function() {
        SanteDB.authentication.logoutAsync().then(function() { 
            $("#logoutModal").modal('hide');
        });
    }

    // Load menus for the current user
    function loadMenus() {
        SanteDB.application.getMenusAsync("org.santedb.admin")
            .then(function (res) {
                $scope.menuItems = res;
                $scope.$applyAsync();
            })
            .catch($rootScope.errorHandler);
    }

    $rootScope.$watch('session', function (nv, ov) {
        if (nv && nv.user) {
            // Add menu items
            loadMenus();
        }
        else
            $scope.menuItems = null;
    });
    if($rootScope.session)
        loadMenus();

}]);