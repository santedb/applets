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
        identityDomain: [],
        subscriptions: []
    };
    $scope.permittedSubscriptions = [];
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


    function canSelectSubscription(subscription, referenceObjects) {
        return subscription.definitions.find(filter => (!filter.guards || filter.guards.length == 0 || checkGuard(filter, referenceObjects)) && ($scope.config.sync.mode == filter.mode || filter.mode == 'FullOrPartial'));
    }

    function checkGuard(filter, referenceObjects) {

        if (!referenceObjects) {
            referenceObjects = $scope.reference[$scope.config.sync.subscribeType.toCamelCase()]; // copy from scope
        }

        if (referenceObjects.length == 0) {
            return false;
        }

        try {
            SanteDB.display.buttonWait("#selectAllButton", true);
            $("#nextButton").prop("disabled", true);

            var retVal = true;
            filter.guards.forEach(function (oldGuard) {
                if (!retVal) return;

                // Rewrite guard
                var guardFilterRegex = /^([\!\sA-Za-z\.&|]*?)\[([A-Za-z]*?)\](.*)$/;
                var valueRegex = /^(\w+?)\=(.*)$/;
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
                referenceObjects
                    .filter(function (f) { return $scope.config.sync.subscribeTo && $scope.config.sync.subscribeTo.indexOf(f.id) > -1; })
                    .forEach(function (subscribed) {
                        var match = valueRegex.exec(newGuard);
                        if (match) {
                            var op = "==", value = match[2];
                            if(value.startsWith("!")) {
                                op = "!=";
                                value = value.substring(1);
                            }
                            switch (value) {
                                case "null":
                                case "true":
                                case "false":
                                    newGuard = `subscribed.${match[1]}${op}${value}`;
                                    break;
                                default:
                                    newGuard = `subscribed.${match[1]}${op}'${value}'`;
                                    break;
                            }
                        }
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

    // Process configuration
    async function _processConfiguration(config, sessionInfo) {

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
                    var integrationPatterns = await SanteDB.configuration.getIntegrationPatternsAsync();
                    var certificates = await SanteDB.resources.certificates.findAsync({ hasPrivateKey: true });
                    config.sync._resource = {};
                    config.sync.subscribeTo = config.sync.subscribeTo || [];
                    $timeout(_ => {
                        subscriptions.resource.forEach((itm) => {
                            $scope.reference.subscriptions.push(itm);
                            config.sync._resource[itm.id] = { selected: true };
                        });
                        $scope.reference.solutions = appSolutions;
                        $scope.reference.certificates = certificates;
                        $scope.serverCaps = appInfo;
                        $scope.reference.integrationPatterns = integrationPatterns;
                        $scope.reference.dataProviders = dataProviders;
                        $scope.reference.providerData = {};
                        $scope.reference.dataProviders.forEach(p => $scope.reference.providerData[p.invariant] = p.options);
                    });

                }
                catch (e) {
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
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }


    // Get necessary information
    SanteDB.authentication.setElevator(new SanteDBElevator(_getConfiguration, false));
    _getConfiguration();

    $scope.$watch("config.sync.subscribeType", function (n, o) {
        if (n) {

            $scope.config.sync.subscribeTo = $scope.config.sync.subscribeTo || [];
            $scope.config.sync.subscribeTo.splice(0, $scope.config.sync.subscribeTo.length);
            $scope.permittedSubscriptions.splice(0, $scope.permittedSubscriptions.length);
        }
    });

    // Watch scope and refresh list of subscriptions
    $scope.$watch('config.sync.subscribeTo.length', function (n, o) {
        // Find in new
        if (n) {
            $scope.permittedSubscriptions.splice(0, $scope.permittedSubscriptions.length);
            $scope.config.sync.subscribeTo.forEach(async function (sid) {
                var referenceObjects = $scope.reference[$scope.config.sync.subscribeType.toCamelCase()];
                var existingInfo = referenceObjects.find(function (p) { return p.id === sid });

                // Don't have any info on this object - Look it up
                if (!existingInfo) {
                    SanteDB.display.buttonWait("#selectAllButton", true);
                    $("#nextButton").prop("disabled", true);
                    try {
                        existingInfo = await SanteDB.resources[$scope.config.sync.subscribeType.toCamelCase()].getAsync(sid, "dropdown");
                        $timeout(() => {
                            $scope.reference[$scope.config.sync.subscribeType.toCamelCase()].push(existingInfo);
                        });
                        referenceObjects.push(existingInfo);
                    }
                    catch (e) {
                        console.error(e);
                    }
                    finally {
                        SanteDB.display.buttonWait("#selectAllButton", false);
                        $("#nextButton").prop("disabled", false);
                    }
                }
                var subscriptions = $scope.reference.subscriptions.filter((s) => canSelectSubscription(s, referenceObjects));
                $timeout(() => {
                    $scope.permittedSubscriptions = subscriptions;
                });
            });
        }
    });

    // Function to advance to next option
    $scope.next = function () {
        // Find the next option
        var next = $("#configurationStages li.nav-item:has(a.active)~li a");
        $scope.lastTab = next.length == 1;
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
                canSelectSubscription(s)) {
                $scope.config.sync._resource[s.uuid] = $scope.config.sync._resource[s.uuid] || {};
                $scope.config.sync._resource[s.uuid].selected = value;
            }
            else {
                $scope.config.sync._resource[s.uuid] = $scope.config.sync._resource[s.uuid] || {};
                $scope.config.sync._resource[s.uuid].selected = false;
            }
        });
    }

    $scope.propogateNetworkChanges = function (n, o) {
        $scope.config.client.clients.forEach(c => {
            c.optimize = $scope.config.client.optimize;
            c.clientCertificate = $scope.config.client.clientCertificate;
        });
    }

    $scope.propogateDataChanges = function (n, o) {
        Object.keys($scope.config.data.connections).forEach(k => {
            var c = $scope.config.data.connections[k];
            c.provider = $scope.config.data.provider;
            c.options = angular.copy($scope.config.data.options);
        });
    }

    // Save configuration settings
    $scope.save = async function (form) {

        try {
            SanteDB.display.buttonWait("#finishButton", true);

            // Get and coy the configuration values
            var config = angular.copy(await SanteDB.configuration.getAsync());
            config.values = {};
            Object.keys(config).filter(o => !o.startsWith("_") && o !== "values").forEach(c => {
                config.values[c] = $scope.config[c];
                delete config[c];
            });
            config.$type = "Configuration";
            // Find the resource definition 
            config.values.sync.subscription = Object.keys(config.values.sync._resource).filter((i) => i !== "undefined" && config.values.sync._resource[i].selected)
                .map(k => $scope.reference.subscriptions.find(p => p.id == k))
                .filter(i => i != null)
                .map(k => k.id);

            // Define the services
            config.values.application.service = $scope.serverCaps.appInfo.service.filter(function (s) { return s.active; })
                .map(function (m) { return { type: m.type } });
            config._autoRestart = true;

            try {
                config = await SanteDB.configuration.saveAsync(config);

                SanteDB.display.buttonWait("#finishButton", false);

                if (config._autoRestart) {
                    $timeout(_ => {
                        $scope.restartTimer = 20;
                        $("#countdownModal").modal({
                            backdrop: 'static'
                        });
                        var iv = $interval(() => {
                            if ($scope.restartTimer-- < 3) {
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
            catch (e) {
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
                    var joinResult = await SanteDB.configuration.joinRealmAsync($scope.config.realm, override === true);
                    SanteDB.display.buttonWait("#joinRealmButton", false);
                    alert(joinResult.welcome || SanteDB.locale.getString("ui.config.realm.success", { realm: $scope.config.realm.address }));
                    var config = await SanteDB.configuration.getAsync(true);
                    config = await _processConfiguration(config, sessionInfo);

                    $timeout(_ => {
                        $scope.config = config;
                        $scope.next();
                    });

                }
                catch (e) {
                    if ((e.$type == "DuplicateNameException" || e.cause && e.cause.$type == "DuplicateNameException") && !override) {
                        if (confirm(SanteDB.locale.getString("ui.config.realm.error.duplicate")))
                            await joinRealmFn(sessionInfo, true);
                        else
                            $rootScope.errorHandler(e);

                    }
                    else
                        $rootScope.errorHandler(e);
                    SanteDB.display.buttonWait("#joinRealmButton", false);

                }
            };
            var elevator = new SanteDBElevator(joinRealmFn, false);
            elevator.setCloseCallback(function (r) {
                if (!r) {
                    SanteDB.display.buttonWait("#joinRealmButton", false);
                }
            });

            SanteDB.authentication.setElevator(elevator);
            await joinRealmFn();
        }
    }

    $scope.leaveRealm = async function () {
        if (confirm(SanteDB.locale.getString("ui.config.action.realm.leave.confirm", { realm: SanteDB.configuration.getRealm() }))) {

            async function leaveRealmFn() {
                try {
                    SanteDB.display.buttonWait("#leaveRealmButton", true);

                    await SanteDB.configuration.leaveRealmAsync();
                    alert(joinResult.welcome || SanteDB.locale.getString("ui.config.realm.leave", { realm: $scope.config.realm.address }));
                    var config = await SanteDB.configuration.getAsync(true);
                    config = await _processConfiguration(config, sessionInfo);

                    $timeout(_ => {
                        $scope.config = config;
                        $scope.next();
                    });
                }
                catch (e) {
                    $rootScope.errorHandler(e);
                }
                finally {
                    SanteDB.display.buttonWait("#leaveRealmButton", false);

                }
            }

            var elevator = new SanteDBElevator(leaveRealmFn, false);
            elevator.setCloseCallback(function (r) {
                if (!r) {
                    SanteDB.display.buttonWait("#leaveRealmButton", false);
                }
            });

            SanteDB.authentication.setElevator(elevator);
            await leaveRealmFn();
        }
    }
}]);