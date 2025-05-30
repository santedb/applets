/// <Reference path="../../core/js/santedb.js"/>
/// <Reference path="../js/santedb-elevator.js"/>
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

/**
 * SanteDB Root JS View
 */

var santedbApp = angular.module('santedb', ['ngSanitize', 'ui.router', 'oc.lazyLoad', 'santedb-lib'])
    .config(['$compileProvider', '$stateProvider', '$urlRouterProvider', '$httpProvider', '$provide', function ($compileProvider, $stateProvider, $urlRouterProvider, $httpProvider, $provide) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(http|https|tel|mailto):/);
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(http|https):/);

        $httpProvider.interceptors.push('AuthInterceptor');

        var startupAsset = false;
        SanteDB.UserInterface.states.forEach(function (state) {
            startupAsset |= state.url === '/';

            if (state.views) {
                for (var vn in state.views) {
                    var view = state.views[vn];
                    if (view.lazy) { // Lazy load
                        if (!Array.isArray(view.lazy))
                            view.lazy = [view.lazy];

                        state.resolve = {
                            'loadState0': ['$ocLazyLoad', function ($ocLazyLoad) {
                                return $ocLazyLoad.load(view.lazy);
                            }]
                        };
                    }
                }
            }

            $stateProvider.state(state);
        });

        // Startup asset
        if (!startupAsset)
            $stateProvider.state({
                name: 'santedb-index',
                url: '/',
                abstract: false,
                views: {
                    '': {
                        controller: '',
                        templateUrl: '/org.santedb.uicore/views/default.html'
                    }
                }
            });


    }]).controller("RootIndexController", ["$scope", function ($scope) {

    }])
    .run(['$rootScope', '$state', '$templateCache', '$transitions', '$ocLazyLoad', '$interval', '$timeout', function ($rootScope, $state, $templateCache, $transitions, $ocLazyLoad, $interval, $timeout) {

        function applyDarkMode(session) {
            if (session && session.userSettings) {
                var uiMode = session.userSettings.find(o => o.key == "uimode");
                if (uiMode && uiMode.value === "dark") {
                    $(["*[class*='-light']"]).each((i, ele) => {
                        var classValue = $(ele).attr("class");
                        if (!classValue) {
                            return;
                        }
                        if (classValue.indexOf('bg-light') > -1) {
                            $(ele).removeClass('bg-light');
                            $(ele).addClass('bg-dark');
                        }
                        if (classValue.indexOf('navbar-light') > -1) {
                            $(ele).removeClass('navbar-light');
                            $(ele).addClass('navbar-dark');
                        }
                        //$(ele).toggleClass('text-light text-dark');
                    })
                    // toggle body class selector
                }
            }
        }

        async function _setLocaleData() {
            try {
                var localeData = await SanteDB.resources.locale.findAsync();

                $timeout(() => {
                    $rootScope.system.locales = Object.keys(localeData);

                    var localeAsset = localeData[SanteDB.locale.getLocale()];
                    if (localeAsset)
                        localeAsset.forEach(function (l) {
                            $.getScript(l);
                        });
                });
            }
            catch (e) {

            }
        }

        // Initialization functions
        var initialize = async function () {
            // Get configuration
            console.info("Initializing Root View");
            try {
                await __SanteDBAppService.GetStatus();

                _setLocaleData();
                var session = await SanteDB.authentication.getSessionInfoAsync();
                var configuration = {};
                var uqDomains = [];
                var conceptRelationshipTypes = [];
                if (session) {
                    configuration = await SanteDB.configuration.getAsync();
                    uqDomains = (await SanteDB.resources.identityDomain.findAsync({ isUnique: true })).resource.map(o => o.domainName);
                    conceptRelationshipTypes = await SanteDB.resources.conceptRelationshipType.findAsync();

                } else {
                    configuration._isConfigured = SanteDB.configuration.getRealm() != null;
                    $rootScope.$watch("session", async function (n, o) {
                        if (n && !o) {
                            initialize();
                        }
                    });
                }

                // Extended attributes
                if (session != null && session.entity != null) {
                    session.entity.telecom = session.entity.telecom || {};
                    if (Object.keys(session.entity.telecom).length == 0) {
                        session.entity.telecom.MobilePhone = { value: "" };
                    }
                }

                // Get user preferences and set them in this view 
                if (session) {
                    session.userSettings = await SanteDB.configuration.getUserSettingsAsync();
                    var uiMode = session.userSettings.find(o => o.key == "uimode");
                    if (uiMode && uiMode.value == "dark") {
                        $($("head").append("<link>"));
                        var css = $("head").children(":last");
                        css.attr({
                            rel: "stylesheet",
                            type: "text/css",
                            href: "/org.santedb.uicore/css/dark.css"
                        });
                        applyDarkMode(session);
                    }
                }


                $timeout(() => {
                    console.info("Populating root context");
                    $rootScope.session = session;

                    var realmName = SanteDB.configuration.getRealm();
                    $rootScope.system = $rootScope.system || {};
                    $rootScope.system.version = SanteDB.application.getVersion();
                    $rootScope.system.locale = SanteDB.locale.getLocale();
                    $rootScope.system.config = configuration;
                    $rootScope.system.config.realmName = realmName;
                    $rootScope.system.config.deviceName = SanteDB.configuration.getDeviceId();
                    $rootScope.system.config.facility = SanteDB.configuration.getAssignedFacilityId();
                    $rootScope.system.config.owner = SanteDB.configuration.getOwnerId();

                    $rootScope.system.uniqueDomains = uqDomains;
                    $rootScope.system.conceptRelationshipTypes = conceptRelationshipTypes.resource;
                    // Make app settings easier to handle
                    var appSettings = {};
                    if (configuration.application) {
                        configuration.application.setting.forEach((k) => appSettings[k.key] = k.value);
                        $rootScope.system.config.application.setting = appSettings;
                    }
                    // Is there a branding environment variable
                    if ((!realmName || configuration && !configuration._isConfigured) && $state.$current.name != 'santedb-config.initial') {
                        $state.go('santedb-config.initial');
                    }
                });
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
        };


        // The online interval to check online state
        var ivlFn = async function () {
            $rootScope.system = $rootScope.system || {};


            if ($rootScope.system && $rootScope.system.config && $rootScope.system.config.integration && $rootScope.system.config.integration.mode == 'synchronize')
                $rootScope.system.online = SanteDB.application.getOnlineState();
            else
                $rootScope.system.online = true;

            $rootScope.system.serviceState = {
                network: $rootScope.system.online,
                ami: SanteDB.application.isAdminAvailable(),
                hdsi: SanteDB.application.isClinicalAvailable()
            };
            // Page information
            $rootScope.page = {
                currentTime: new Date(),
                maxEventTime: new Date().tomorrow().trunc().addSeconds(-1),
                today: moment(new Date()).format('YYYY-MM-DD'),
                minEventTime: $rootScope.page.minEventTime || new Date().yesterday()
            };

            // Session for expiry?
            if ($rootScope.session && $rootScope.session.exp && ($rootScope.session.exp - Date.now() < 120000)) {
                var expiresIn = Math.round(($rootScope.session.exp - Date.now()) / 1000);
                var mins = Math.trunc(expiresIn / 60), secs = expiresIn % 60;
                if (("" + secs).length < 2)
                    secs = "0" + secs;
                var messageStr = `${SanteDB.locale.getString("ui.session.aboutToExpire")} ${mins}:${secs} ${SanteDB.locale.getString("ui.session.action.extend")}`;

                if (expiresIn < 0) // already expired
                {
                    var serverSession = null;
                    try {
                        serverSession = await SanteDB.authentication.getSessionInfoAsync(true);
                    }
                    catch (e) {
                        console.info(e);
                    }

                    if (serverSession == null) {
                        $timeout(() => {
                            $templateCache.removeAll();
                            $rootScope.session = null;
                            delete ($rootScope.session);
                            toastr.clear();
                            window.onbeforeunload = null;
                            $state.go("login");
                        });
                    }

                }
                else if (!_extendToast) {
                    _extendToast = toastr.warning(messageStr, null, {
                        closeButton: false,
                        preventDuplicates: true,
                        onclick: async function () {
                            try {
                                var session = await SanteDB.authentication.refreshLoginAsync();
                                _extendToast = null;
                                toastr.clear();
                                $timeout(() => $rootScope.session = session);
                            } catch (e) { $rootScope.errorHandler(e) };
                        },
                        positionClass: "toast-bottom-center",
                        showDuration: "0",
                        hideDuration: "0",
                        timeOut: "0",
                        extendedTimeOut: "0"
                    });
                }
                else {
                    $(_extendToast).children('.toast-message').html(messageStr);
                }
            }
            else
                toastr.clear();

        };

        // Setup scope
        $rootScope.system = {};

        /**
         * Register the reload button
         */
        $.fn.dataTable.ext.buttons.reload = {
            text: function () { return '<i class="fa fa-sync"></i> ' + SanteDB.locale.getString("ui.action.reload"); },
            className: 'btn btn-success',
            action: function (e, dt) {
                dt.ajax.reload();
            }
        };

        /** Setup defaults */
        $.extend(true, $.fn.dataTable.defaults, {
            "language": {
                "infoFiltered": "",
                "processing": SanteDB.locale.getString("ui.wait")
            }
        });


        $(window).bind("resize", function () {
            $rootScope.windowSize = window.innerWidth;
        });
        $rootScope.StatusKeys = StatusKeys;
        $rootScope.windowSize = window.innerWidth;

        // Extend toast information
        var _extendToast = null;

        initialize();

        // Watch for user request to change default language in browser
        $rootScope.$watch("system.locale", function (n, o) {
            if (n && o && n != o) {
                SanteDB.locale.setLocale(n);
                $templateCache.removeAll();
                if ($state.$current.name != "") {
                    $state.reload();
                }
            }
        });

        // Watch for user request to change default language in browser
        $rootScope.$watch(function (s) { return SanteDB.locale.getLocale(); }, function (n, o) {
            if (n && n != o) {
                $templateCache.removeAll();
                _setLocaleData();
            }
        });

        if (window.location.hash == "")
            window.location.hash = "#!/";

        // Transitions
        $transitions.onBefore({}, function (transition) {
            console.info(`Transitioning to ${transition._targetState._definition.self.name}`);

            if (Object.keys(transition._targetState.params).length == 0)
                $rootScope._transition = transition._targetState._definition.self.name; //HACK: Used for transition back to this page when there is an ELEVATE on the auth interceptor
            $(".modal").modal('hide');
            $('.popover').popover('hide');

            // Clear out elevator
            SanteDB.authentication.setElevator(null);

            if (transition._targetState._definition.self.name != transition._targetState._definition.self.name != $state.$current.name)
                $("#pageTransitioner").show();
        });

        $transitions.onSuccess({}, function (transition) {
            $(".modal").modal('hide');
            $('.popover').popover('hide');
            $("#pageTransitioner").hide();
            $('html,body').animate({
                scrollTop: 0
            },
                'fast');
            $rootScope.previousState = transition.$from();

            // Change title
            if (transition.$to() && transition.$to().self && transition.$to().self.displayName) {
                document.title = `${transition.$to().self.displayName}`;
            }
            else {
                document.title = SanteDB.locale.getString("ui.title");
            }
            $("#navbarResponsive").collapse('hide');
            delete ($rootScope._transition);
            applyDarkMode($rootScope.session);
            attachStickyScrollEvent();
        });

        $transitions.onError({}, function (transition) {

            $(".modal").modal('hide');
            $('.popover').popover('hide');
            $("#pageTransitioner").hide();
            delete ($rootScope._transition);

            // HACK: The user tried to nav to a screen when we wanted to go to a config page
            if (transition._targetState._identifier == "santedb-config.initial") {
                window.location = "#!/config/initialSettings";
            }

        });


        /**
         * @summary Global Error Handler
         * TODO: Move this over to a service
         */
        $rootScope.errorHandler = function (e) {

            console.error(e);
            // HACK: Angular JS - We want to have the error display update on digest
            $timeout(_ => {
                $rootScope.error = prepareErrorForDisplay(e);
                var bugCallList = SanteDB.application.getResourceViewer("DiagnosticReport");
                if (bugCallList)
                    $rootScope.error.fileBug = function () {
                        for (var i in bugCallList)
                            if (bugCallList[i]()) return;
                    }
                $("#errorModal").modal({ backdrop: 'static' });
            })
        }

        function prepareErrorForDisplay(e) {
            var userMessageKey = `error.type.${e.$type}.userMessage`;
            var userMessage = SanteDB.locale.getString(userMessageKey);
            if (userMessage == userMessageKey) // no special user message - show default
            {
                userMessageKey = e.message + '.text';
                userMessage = SanteDB.locale.getString(userMessageKey);
                var retVal = {
                    userMessage: e.userMessage ? e.userMessage : userMessage != userMessageKey ? userMessage : null,
                    details: e.detail || e,
                    message: e.message || 'ui.error.title',
                    type: e.$type,
                    rules: e.rules,
                    cause: []
                };
                var cause = e.cause;
                while (cause) {
                    retVal.cause.push({
                        detail: cause.detail || cause,
                        message: cause.message || 'ui.error.title',
                        type: cause.$type
                    });
                    cause = cause.cause;
                }
                return retVal;
            }
            else {
                e.type = e.$type;
                e.userMessage = userMessage;
                return e;
            }
        }
        // Page information
        $rootScope.page = {
            currentTime: new Date(),
            maxEventTime: new Date().tomorrow().trunc().addSeconds(-1),
            minEventTime: new Date().yesterday()
        };

        $interval(ivlFn, 15000);


        // Set locale for sleect2
        $.fn.select2.defaults.set('language', SanteDB.locale.getLocale());

        // Fix modal scrolling
        $(document).on('hidden.bs.modal', function () {
            if ($('.modal.in').length > 0)
                $('body').addClass('modal-open');
        });

        // Cascade an object across all scopes

    }]);
