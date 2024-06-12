/// <reference path="../../core/js/santedb.js"/>
/// <reference path="../../core/js/santedb-model.js"/>
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
 * 
 * User: fyfej
 * Date: 2023-5-19
 */
angular.module('santedb').controller('AdminLayoutController', ["$scope", "$rootScope", "$state", "$templateCache", "$interval", "$timeout", function ($scope, $rootScope, $state, $templateCache, $interval, $timeout) {

    var _lastTickle = null;
    initializeSideNavTriggers();

    // Shows the elevation dialog, elevates and then refreshes the state
    $scope.overrideRefresh = function () {
        new SanteDBElevator(
            function () {
                $templateCache.removeAll();
                $state.reload();
            }
        ).elevate($rootScope.session);
    }

    // abandon session
    $scope.abandonSession = async function () {
        try {
            SanteDB.display.buttonWait("#btnLogout", true);
            await SanteDB.authentication.logoutAsync();
            $("#logoutModal").modal('hide');
            $timeout(() => {
                $templateCache.removeAll();
                $state.go('login');
                location.reload();
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnLogout", false);
        }
    }

    // Load menus for the current user
    async function loadMenus() {
        try {
            var menus = await SanteDB.application.getMenusAsync("org.santedb.admin")
            $timeout(() => $scope.menuItems = menus);
        }
        catch (e) {
            toastr.warning(SanteDB.locale.getString("ui.admin.menuError"));
            console.error(e);
        }
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

    if ($rootScope.session)
        loadMenus();

    // Check for new mail
    var checkMail = async function () {
        try {
            var mailMessages = await SanteDB.resources.mail.findAssociatedAsync("Inbox", "Message", { flags: 0 });
            await Promise.all(mailMessages.resource.map(async function (mb) {
                mb.targetModel = await SanteDB.resources.mail.getAssociatedAsync("Inbox", "Message", mb.target);
            }));
            $timeout(() => $scope.mailbox = mailMessages.resource);
        }
        catch (e) {
            toastr.warning(SanteDB.locale.getString("ui.admin.mailError"));
            console.error(e);
        }
    };

    // Check for new tickles
    var checkTickles = async function () {
        try {
            var sourceTickles = await SanteDB.resources.tickle.findAsync({});
            var tickles = [];
            var hasAlert = false;
            sourceTickles.forEach(function (t) {

                if (!t.type) return;

                if (t.type.indexOf && t.type.indexOf("Danger") > -1 || t.type & 2)
                    hasAlert = true;

                if (t.type.indexOf && t.type.indexOf("Toast") > -1 || t.type & 4) {
                    if (t.type.indexOf && t.type.indexOf("Danger") > -1 || t.type & 2)
                        toastr.error(t.text, null, { preventDuplicates: true });
                    else
                        toastr.info(t.text, null, { preventDuplicates: true });

                    SanteDB.resources.tickle.deleteAsync(t.id);
                }

                tickles.push(t);

            });
            
            var lastTickle = tickles.length > 0 ? tickles[tickles.length - 1].id : null;
            if (!lastTickle) {
                _lastTickle = null;
            }
            else if(lastTickle != _lastTickle) {
                _lastTickle = lastTickle;
                toastr.info(SanteDB.locale.getString("ui.emr.alerts.new"), null, { preventDuplicates: true });
            }

            $timeout(() => $scope.tickles = tickles);
        }
        catch (e) {
            toastr.warning(SanteDB.locale.getString("ui.admin.tickleError"));
            console.error(e);
        }
    }

    // Check for conflict status
    var checkConflicts = async function () {
        if ($rootScope.system && $rootScope.system.config && $rootScope.system.config.sync && $rootScope.system.config.sync.mode == 'Sync')
        {
            try {
                await SanteDB.resources.queue.findAsync();
                $timeout(() => $scope.queue = queue);
            }
            catch(e) {
                toastr.warning(SanteDB.locale.getString("ui.admin.queueError"));
                console.error(e);
            }
        }
    }

    // Clear all tickles
    $scope.clearTickles = async function () {
        if ($scope.tickles) {

            await Promise.all($scope.tickles.map(async function (t) {
                try {
                    await SanteDB.resources.tickle.deleteAsync(t.id);
                    checkTickles();
                }
                catch(e) {
                    toastr.warning(SanteDB.locale.getString("ui.admin.tickleError"));
                }
            }));

        }
    }

    checkMail();
    checkTickles();
    checkConflicts();

    // Mailbox
    var refreshInterval = $interval(function () {
        checkTickles();
        checkConflicts();
    }, 60000);

    var mailInterval = $interval(checkMail, 600000);

    $scope.$on('$destroy', function () {
        if (refreshInterval)
            $interval.cancel(refreshInterval);
        if(mailInterval)
            $interval.cancel(mailInterval);
    });

    // Is there no route? We should show the dashboard
    $rootScope.$watch("system.config", function(n, o) {
        if(n) {
            if(n._isConfigured === false) {
                $state.go("santedb-config.initial");
            }
            else if ($state.$current == "santedb-admin") {
                $state.go("santedb-admin.dashboard");
            }
        }
    });

    

}]);

