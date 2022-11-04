/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../uicore/js/santedb-ui.js"/>
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
angular.module('santedb').controller('InitialSettingsController', ['$scope', '$rootScope', '$interval', '$timeout', function ($scope, $rootScope, $interval, $timeout) {

    // Reference data
    $scope.reference = {
        place: [],
        facility: [],
        assigningauthority: []
    };
    $scope.newItem = {};
    $scope.serverCaps = {};
    $scope.widgets = {};
    // Get the widgets for the config panel
    SanteDB.application.getWidgetsAsync("org.santedb.config.init", "Tab").then(function (d) {
        $scope.widgets = d;
    }).catch(function (e) { console.error(e); });

    // Add other setting
    $scope.addOtherSetting = function (newItem) {
        if (!newItem.key)
            newItem.keyMissingError = true;
        else {
            delete (newItem.keyMissingError);
            $scope.config.application.setting.push(angular.copy(newItem));
            newItem.key = "";
            newItem.value = "";
        }
    }

    
    // Process configuration
    async function _processConfiguration(config, sessionInfo) {

        $("#configurationStages li.nav-item").children("a").on('shown.bs.tab', function (e) {
            $scope.lastTab = e.currentTarget.innerHTML == $("#configurationStages li.nav-item").children("a").last().html();
            $scope.$apply();
        });

        
        if (!config._isConfigured) {

                /*$scope.config.network.useProxy = $scope.config.network.proxyAddress != null;
                $scope.config.network.optimize = "gzip";
                $scope.config.sync = $scope.config.sync || {};
                $scope.config.sync.mode = "sync";
                $scope.config.sync.subscribeTo = $scope.config.sync.subscribeTo || [];
                $scope.config.sync.subscribeType = "Facility";
                $scope.config.subscription = $scope.config.subscription || {};
                $scope.config.subscription.mode = $scope.config.subscription.mode || "Subscription";
                $scope.config.log.mode = $scope.config.log.writers[0].filter || "Warning";
                if(sessionInfo && sessionInfo.entity)
                    $scope.config.security.owner = [ sessionInfo.entity.id ];
                $scope.config.sync._resource = {};
            
                $scope.config.data = {
                    provider: "sqlite",
                    options: {}
                };

                $scope.config.security.offline = { enable: true };*/

            if (config.realm.address) {

                try {
                    // Get subscription reference
                    var subscriptions = await SanteDB.resources.subscriptionDefinition.findAsync({ _upstream: true });
                    var appSolutions = await SanteDB.application.getAppSolutionsAsync();
                    var appInfo = await SanteDB.application.getAppInfoAsync();
                    var dataProviders = await SanteDB.configuration.getDataProvidersAsync();

                    $timeout(_ => {
                        subscriptions.resource.forEach((itm) => {
                            itm.definitions.forEach(function (defn) {
                                $scope.reference.subscriptions.push(defn);
                                config.sync._resource[defn.name] = { selected: true };
                            });
                        });
                        $scope.reference.solutions = appSolutions;
                        
                        $scope.serverCaps = appInfo;

                        $scope.reference.dataProviders = dataProviders;
                        if (config.data.provider) {
                            $scope.reference.providerData = $scope.reference.dataProviders.find((o) => o.invariant == config.data.provider);
                        }
                    });

                }
                catch(e) {
                    $rootScope.errorHandler(e);
                }
            }

        }
        else 
            $("#alreadyConfiguredModal").modal({ backdrop: 'static' });

        return config;
    }

    // Get configuration from the server
    async function _getConfiguration(sessionInfo) {
        try {
            var config = await SanteDB.configuration.getAsync();
            config = await _processConfiguration(config, sessionInfo);
            $timeout(() => $scope.config = config);
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }


    // Get necessary information
    SanteDB.authentication.setElevator(new SanteDBElevator(_getConfiguration, false));
    _getConfiguration();

    // Watch for change in data provider
    $scope.$watch('config.data.provider', function (n, o) {
        if (n && $scope.reference.dataProviders)
            $scope.reference.providerData = $scope.reference.dataProviders.find(function (o) { return o.invariant == n });
    });

    // Watch scope and refresh list of subscriptions
    $scope.$watch('config.sync.subscribeTo.length', function (n, o) {
        // Find in new
        if (n) {
            $scope.permittedSubscriptions = [];
            $scope.config.sync.subscribeTo.forEach(function (sid) {
                var existingInfo = $scope.reference[$scope.config.sync.subscribeType.toLowerCase()].find(function (p) { return p.id === sid });
                
                // Don't have any info on this object - Look it up
                if (!existingInfo) {
                    SanteDB.display.buttonWait("#selectAllButton", true);
                    $("#nextButton").prop("disabled", true);

                    SanteDB.resources[$scope.config.sync.subscribeType.toCamelCase()].getAsync(sid).then(function (placeInfo) {
                        $scope.reference[$scope.config.sync.subscribeType.toLowerCase()].push(placeInfo);
                        try {
                            SanteDB.display.buttonWait("#selectAllButton", false);
                            $("#nextButton").prop("disabled", false);
                            $scope.permittedSubscriptions = $scope.reference.subscriptions.filter((filter) =>  (!filter.guards || filter.guards.length == 0 || $scope.checkGuard(filter)) && ($scope.config.subscription.mode == filter.mode || filter.mode == 'AllOrSubscription'));
                            $scope.$apply(); // Apply scope to refresh the check guard conditions
                        }
                        catch (e) { }
                    }).catch((e)=>console.error(e));

                }
                else {
                    $scope.permittedSubscriptions = $scope.reference.subscriptions.filter((filter) => (!filter.guards || filter.guards.length == 0 || $scope.checkGuard(filter)) && ($scope.subscription.mode == filter.mode || filter.mode == 'AllOrSubscription'));
                }
            });
        }
    });

    // Verifies that a guard condition on a filter passes
    $scope.checkGuard = function (filter) {

        if ($scope.reference[$scope.config.sync.subscribeType.toLowerCase()].length == 0) {
            return false;
        }

        try {
            SanteDB.display.buttonWait("#selectAllButton", true);
            $("#nextButton").prop("disabled", true);

            var retVal = true;
            filter.guards.forEach(function (oldGuard) {
                if (!retVal) return;

                // Rewrtie guard
                var guardFilterRegex = new RegExp('^([\\!\\sA-Za-z\\.&|]*?)\\[([A-Za-z]*?)\\](.*)$');
                var newGuard = "";
                while (oldGuard.length > 0) {
                    var match = guardFilterRegex.exec(oldGuard);
                    if (!match) {
                        newGuard += oldGuard;
                        break;
                    }
                    else {
                        newGuard += `${match[1]}.${match[2]}`;
                        oldGuard = match[3];
                    }
                }
                $scope.reference[$scope.config.sync.subscribeType.toLowerCase()]
                    .filter(function (f) { return $scope.config.sync.subscribeTo && $scope.config.sync.subscribeTo.indexOf(f.id) > -1; })
                    .forEach(function (subscribed) {
                        var e = $scope.$eval(newGuard, { "subscribed": subscribed });
                        retVal &= (e != null) && (e !== false);
                    });
            });

            console.info(filter.resource, filter.name, filter.trigger, filter.guards, retVal);
            return retVal

        }
        finally {
            SanteDB.display.buttonWait("#selectAllButton", false);
            $("#nextButton").prop("disabled", false);

        }
    }

    // Function to advance to next option
    $scope.next = function () {
        // Find the next option
        var next = $("#configurationStages li.nav-item:has(a.active)~li a");
        if (next.length > 0)
            $(next[0]).tab('show');
    };

    // Function to advance to previous option
    $scope.back = function () {
        var prev = $("#configurationStages li.nav-item:has(a.active)").prev();
        if (prev.length == 0) return;
        while (prev.children("a:first").length == 0)
            prev = $(prev).prev();
        if (prev) {
            prev.children("a:first").tab('show');
            $scope.lastTab = false;
        }
    };

    // Select all guard conditions
    $scope.setSubscriptionSelection = async function (value) {
        $scope.reference.subscriptions.forEach(function (s) {
            if (value &&
                (!s.guard ^ (s.guard && $scope.checkGuard(s))) &&
                ($scope.config.subscription.mode == s.mode || s.mode == 'AllOrSubscription')) {
                $scope.config.sync._resource[s.name] = $scope.config.sync._resource[s.name] || {};
                $scope.config.sync._resource[s.name].selected = value;
            }
            else {
                $scope.config.sync._resource[s.name] = $scope.config.sync._resource[s.name] || {};
                $scope.config.sync._resource[s.name].selected = false;
            }
        });
    }

    // Save configuration settings
    $scope.save = async function (form) {

        try {
            SanteDB.display.buttonWait("#finishButton", true);
            
            // Find the resource definition 
            $scope.config.sync.subscription = Object.keys($scope.config.sync._resource).filter((i) => $scope.config.sync._resource[i].selected)
                .map(k => $scope.reference.subscriptions.find(p => p.name == k))
                .filter(i => i != null && 
                    $scope.checkGuard(i) && 
                    (i.mode == "AllOrSubscription" || i.mode == $scope.config.subscription.mode))
                .map(k=>k.name);

            // Define the services
            $scope.config.application.service = $scope.serverCaps.appInfo.service.filter(function (s) { return s.active; })
                .map(function (m) { return { type: m.type } });
            $scope.config.autoRestart = true;
            
            try {
                var config = await SanteDB.configuration.saveAsync($scope.config);
                
                SanteDB.display.buttonWait("#finishButton", false);

                if(c.autoRestart) {
                    $timeout(_ => {
                        $scope.restartTimer = 20;
                        $("#countdownModal").modal({
                            backdrop: 'static'
                        });
                        var iv = $interval(() => {
                            if($scope.restartTimer-- < 3)
                            { 
                                window.location.hash = '';
                                window.location.reload();
                            }
                        }, 1000);
                    });
                }
                else {
                    SanteDB.application.close();
                    $("#completeModal").modal({
                        backdrop: 'static'
                    });
                }
            }
            catch(e) {
                SanteDB.display.buttonWait("#finishButton", false);
                $rootScope.errorHandler(e);
            }
        }
        catch (e) {
            SanteDB.display.buttonWait("#finishButton", false);
            $rootScope.errorHandler(e);
        }
    }

    // Join the realm
    $scope.joinRealm = async function (form) {

        if (!form.$valid)
            return;
        else {
            // logic to join the realm
            var joinRealmFn = async function (sessionInfo, override) {

                SanteDB.display.buttonWait("#joinRealmButton", true);

                try {
                    await SanteDB.configuration.joinRealmAsync($scope.config.realm, override === true);
                    SanteDB.display.buttonWait("#joinRealmButton", false);
                    alert(SanteDB.locale.getString("ui.config.realm.success"));
                    var config = await _processConfiguration(config, sessionInfo);

                    $timeout(_ => {
                        $scope.config = config;
                        $scope.next();
                    });

                }
                catch (e) {
                    SanteDB.display.buttonWait("#joinRealmButton", false);
                    if (e.$type == "DuplicateNameException" && !override) {
                        if (confirm(SanteDB.locale.getString("ui.config.realm.error.duplicate")))
                            await joinRealmFn(sessionInfo, true);
                        else
                            $rootScope.errorHandler(e);

                    }
                    else
                        $rootScope.errorHandler(e);
                }
            };
            var elevator = new SanteDBElevator(joinRealmFn, false);
            elevator.setCloseCallback(function() {
                SanteDB.display.buttonWait("#joinRealmButton", false);
            });
            
            SanteDB.authentication.setElevator(elevator);
            await joinRealmFn();
        }
    }
}]);