/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../uicore/js/santedb-ui.js"/>
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
 * Date: 2018-10-14
 */

angular.module('santedb').controller('InitialSettingsController', ['$scope', '$rootScope', function ($scope, $rootScope) {

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
    SanteDB.application.getWidgetsAsync("Configuration", "Tab").then(function (d) {
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
    function _processConfiguration(config) {
        $scope.config = config;

        $("#configurationStages li.nav-item").children("a").on('shown.bs.tab', function (e) {
            $scope.lastTab = e.currentTarget.innerHTML == $("#configurationStages li.nav-item").children("a").last().html();
            $scope.$apply();
        });

        if (!config.isConfigured) {
            $scope.config.security.port = 8080;
            $scope.config.network.useProxy = $scope.config.network.proxyAddress != null;
            $scope.config.network.optimize = "gzip";
            $scope.config.sync = $scope.config.sync || {};
            $scope.config.sync.mode = "sync";
            $scope.config.sync.facilities = $scope.config.sync.facilities || [];
            $scope.config.sync.subscribeType = "Facility";
            $scope.config.subscription = $scope.config.subscription || {};
            $scope.config.subscription.mode = $scope.config.subscription.mode || "Subscription";
            $scope.config.log.mode = $scope.config.log.writers[0].filter || "Warning";
            $scope.config.sync._resource = {};
            $scope.config.data = {
                provider: "sqlite",
                options: {}
            };

            var configuredHasher = $scope.config.application.service.find(function (e) { return e.type.indexOf('PasswordHasher') > -1 });
            if (configuredHasher) {
                configuredHasher.type = configuredHasher.type.replace("SanteDB.DisconnectedClient.Xamarin.Security.", "");
                configuredHasher.type = configuredHasher.type.substr(0, configuredHasher.type.indexOf(","));
                $scope.config.security.hasher = configuredHasher.type;
            }
            else
                $scope.config.security.hasher = "SHA256PasswordHasher";

            $scope.config.security.offline = { enable: true };

            if (config.realmName) {

                // Get subscription reference
                SanteDB.resources.subscriptionDefinition.findAsync({ _extern: true }).then(function (d) {
                    $scope.reference.subscriptions = [];
                    d.item.forEach(function (itm) {
                        itm.definitions.forEach(function (defn) {
                            $scope.reference.subscriptions.push(defn);
                            $scope.config.sync._resource[defn.name] = { selected: true };
                        });
                    });
                    try {
                        $scope.$apply();
                    }
                    catch (e) { }
                }).catch($rootScope.errorHandler);


                SanteDB.application.getAppSolutionsAsync().then(function (s) {
                    $scope.solutions = s;
                    $scope.$apply();
                }).catch($rootScope.errorHandler);

                SanteDB.application.getAppInfoAsync().then(function (d) {
                    $scope.serverCaps = d;
                    $scope.$apply();

                    SanteDB.configuration.getDataProvidersAsync().then(function (d) {
                        $scope.reference.dataProviders = d;
                        if ($scope.config.data.provider)
                            $scope.reference.providerData = $scope.reference.dataProviders.find(function (o) { return o.invariant == $scope.config.data.provider });
                    }).catch($rootScope.errorHandler);

                }).catch($rootScope.errorHandler);


            }

        }
        else
            $("#alreadyConfiguredModal").modal({ backdrop: 'static' });
        $scope.$apply();
    }

    // Get configuration from the server
    function _getConfiguration() {
        SanteDB.configuration.getAsync().then(function (config) {
            _processConfiguration(config);
        }).catch($rootScope.errorHandler);
    }


    // Get necessary information
    SanteDB.authentication.setElevator(new SanteDBElevator(_getConfiguration));
    _getConfiguration();

    // Watch for change in data provider
    $scope.$watch('config.data.provider', function (n, o) {
        if (n && $scope.reference.dataProviders)
            $scope.reference.providerData = $scope.reference.dataProviders.find(function (o) { return o.invariant == n });
    });

    // Watch scope and refresh list of subscriptions
    $scope.$watch('config.sync.facilities.length', function (n, o) {
        // Find in new
        if (n)
            $scope.config.sync.facilities.forEach(function (sid) {
                var existingInfo = $scope.reference[$scope.config.sync.subscribeType.toLowerCase()].find(function (p) { return p.id === sid });
                if (!existingInfo) {
                    SanteDB.display.buttonWait("#selectAllButton", true);
                    $("#nextButton").prop("disabled", true);

                    SanteDB.resources[$scope.config.sync.subscribeType.toCamelCase()].getAsync(sid).then(function (placeInfo) {
                        $scope.reference[$scope.config.sync.subscribeType.toLowerCase()].push(placeInfo);
                        try {
                            SanteDB.display.buttonWait("#selectAllButton", false);
                            $("#nextButton").prop("disabled", false);
                            $scope.$apply(); // Apply scope to refresh the check guard conditions
                        }
                        catch (e) { }
                    });
                }
            });
    });

    // Verifies that a guard condition on a filter passes
    $scope.checkGuard = function (filter) {

        if ($scope.reference[$scope.config.sync.subscribeType.toLowerCase()].length == 0) return false;

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
                    .filter(function (f) { return $scope.config.sync.facilities.indexOf(f.id) > -1; })
                    .forEach(function (subscribed) {
                        var e = $scope.$eval(newGuard, { "subscribed": subscribed });
                        retVal &= (e != null) && (e !== false);
                    });
            });

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
    $scope.setSubscriptionSelection = function (value) {
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
    $scope.save = function (form) {

        try {
            SanteDB.display.buttonWait("#finishButton", true);
            // Find the resource definition 
            $scope.config.sync.resources = Object.keys($scope.config.sync._resource).filter(function (i) {
                return $scope.config.sync._resource[i].selected;
            }).map(function (k) {
                var retVal = $scope.reference.subscriptions.find(function (p) { return p.name == k });
                return retVal;
            }).filter(function (i) { 
                return i != null && 
                    $scope.checkGuard(i) && 
                    (i.mode == "AllOrSubscription" || i.mode == $scope.config.subscription.mode); 
            });

            // Define the services
            $scope.config.application.service = $scope.serverCaps.appInfo.service.filter(function (s) { return s.active; })
                .map(function (m) { return { type: m.type } });

            SanteDB.configuration.saveAsync($scope.config)
                .then(function (c) {
                    SanteDB.display.buttonWait("#finishButton", false);
                    SanteDB.application.close();
                    $("#completeModal").modal({
                        backdrop: 'static'
                    });
                })
                .catch(function (e) {
                    SanteDB.display.buttonWait("#finishButton", false);
                    $rootScope.errorHandler(e);
                });
        }
        catch (e) {
            SanteDB.display.buttonWait("#finishButton", false);
            $rootScope.errorHandler(e);
        }
    }

    // Join the realm
    $scope.joinRealm = function (form) {

        if (!form.$valid)
            return;
        else {
            // logic to join the realm
            var joinRealmFn = function (override) {

                SanteDB.display.buttonWait("#joinRealmButton", true);
                SanteDB.configuration.joinRealmAsync($scope.config.security, override === true)
                    .then(function (config) {
                        SanteDB.display.buttonWait("#joinRealmButton", false);
                        alert(SanteDB.locale.getString("ui.config.realm.success"));
                        _processConfiguration(config);

                        //SanteDB.authentication.setElevator(null);
                        $scope.next();
                    })
                    .catch(function (e) {

                        SanteDB.display.buttonWait("#joinRealmButton", false);
                        if (e.$type == "DuplicateNameException" && !override) {
                            if (confirm(SanteDB.locale.getString("ui.config.realm.error.duplicate")))
                                joinRealmFn(true);
                            else
                                $rootScope.errorHandler(e);

                        }
                        else
                            $rootScope.errorHandler(e);

                    });
            };
            SanteDB.authentication.setElevator(new SanteDBElevator(joinRealmFn));
            joinRealmFn();
        }
    }
}]);