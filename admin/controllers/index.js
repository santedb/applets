/// <reference path="../../core/js/santedb.js"/>
/// <reference path="../../core/js/santedb-model.js"/>
/*
 * Portions Copyright 2015-2019 Mohawk College of Applied Arts and Technology
 * Portions Copyright 2019-2019 SanteSuite Contributors (See NOTICE)
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
 * User: Justin Fyfe
 * Date: 2019-8-8
 */
angular.module('santedb').controller('AdminLayoutController', ["$scope", "$rootScope", "$state", "$templateCache", "$interval", function ($scope, $rootScope, $state, $templateCache, $interval) {

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
    
    // On logout transition to the login state
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

    // Watch the session and load menus accordingly (in case user elevates)
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

    // Check for new mail
    var checkMail = function() {

        SanteDB.resources.mail.findAsync({ flags: 0 })
            .then(function(d) {
                $scope.mailbox = d.item;
                $scope.$apply();
            })
            .catch(function(e) { 
                toastr.warning(SanteDB.locale.getString("ui.admin.mailError"));
                console.error(e) 
            });
    };

    // Check for new tickles
    var checkTickles = function() {
        SanteDB.resources.tickle.findAsync({})
            .then(function(d) {
                $scope.tickles = d;


                // Any tickles that need toast?
                d.forEach(function(t) {

                    if(t.type & 4) {
                        if(t.type & 2)
                            toastr.error(t.text, null, { preventDuplicates: true });
                        else 
                            toastr.info(t.text, null, { preventDuplicates: true });
                        
                        SanteDB.resources.tickle.deleteAsync(t.id);
                    }
                    t.isError = (t.typ3 & 5);
                });
                $scope.$apply();
            })
            .catch(function(e) { 
                toastr.warning(SanteDB.locale.getString("ui.admin.tickleError"));
                console.error(e); });
    }

    // Check for conflict status
    var checkConflicts = function() {
        if($rootScope.system && $rootScope.system.config && $rootScope.system.config.sync && $rootScope.system.config.sync.mode == 'Sync')
            SanteDB.resources.queue.findAsync()
                .then(function(queue) {
                    $scope.queue = queue;
                    $scope.$apply();
                })
                .catch(function(e) {
                    toastr.warning(SanteDB.locale.getString("ui.admin.queueError"));
                    console.error(e);
                });
    }

    checkMail();
    checkTickles();
    checkConflicts();

    // Mailbox
    var refreshInterval = $interval(function() {
        checkTickles();
        checkMail();
        checkConflicts();
    } , 60000);

    $scope.$on('$destroy',function(){
        if(refreshInterval)
            $interval.cancel(refreshInterval);   
    });

    // Is there no route? We should show the dashboard
    if($state.$current == "santedb-admin") 
        $state.transitionTo("santedb-admin.dashboard");
}]);