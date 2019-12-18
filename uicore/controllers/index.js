/// <Reference path="../../core/js/santedb.js"/>
/// <Reference path="../js/santedb-elevator.js"/>
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
 * Date: 2018-7-26
 */

/**
 * SanteDB Root JS View
 */
var santedbApp = angular.module('santedb', ['ngSanitize', 'ui.router', 'oc.lazyLoad', 'santedb-lib'])
    .config(['$compileProvider', '$stateProvider', '$urlRouterProvider', '$httpProvider', function ($compileProvider, $stateProvider, $urlRouterProvider, $httpProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(http|https|tel):/);
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

        try {
            eval('async () => {}');
        } catch (e) {
            if (e instanceof SyntaxError)
                $scope.asyncUnavailable = true;
        }
        
    }])
    .run(['$rootScope', '$state', '$templateCache', '$transitions', '$ocLazyLoad', '$interval', function ($rootScope, $state, $templateCache, $transitions, $ocLazyLoad, $interval) {

       
        /**
         * Register the reload button
         */
        $.fn.dataTable.ext.buttons.reload = {
            text: '<i class="fa fa-sync"></i> ' + SanteDB.locale.getString("ui.action.reload"),
            className: 'btn btn-success',
            action: function (e, dt) {
                dt.ajax.reload();
            }
        };

        /** Setup defaults */
        $.extend(true, $.fn.dataTable.defaults, {
            "language": {
                "infoFiltered": "",
                "processing": "<i class='fa fa-circle-notch fa-spin'></i> " + SanteDB.locale.getString("ui.wait")
            }
        });


        $(window).bind("resize", function () {
            $rootScope.windowSize = window.innerWidth;
            $rootScope.$apply();
        });
        $rootScope.windowSize = window.innerWidth;
        // Extend toast information
        var _extendToast = null;

        // Localization
        SanteDB.resources.locale.findAsync().then(function (locale) {
            var localeAsset = locale[SanteDB.locale.getLocale()];
            if(localeAsset)
                localeAsset.forEach(function (l) {
                    $.getScript(l);
                });
        }).catch(function (e) {
            $rootScope.errorHandler(e);
        });

        if (window.location.hash == "")
            window.location.hash = "#!/";

        // Get configuration
        SanteDB.configuration.getAsync().then(function (d) {
            $rootScope.system = {};
            $rootScope.system.config = d;
            $rootScope.system.version = SanteDB.application.getVersion();

            if (!$rootScope.system.config.isConfigured && $state.$current.name != 'santedb-config.initial')
                $state.transitionTo('santedb-config.initial');

            $rootScope.$apply();
        }).catch(function (e) { $rootScope.errorHandler(e); });

        // Transitions
        $transitions.onBefore({}, function (transition) {
            console.info(`Transitioned to ${transition._targetState._definition.self.name}`);

            if(Object.keys(transition._targetState.params).length == 0)
                $rootScope._transition = transition._targetState._definition.self.name; //HACK: Used for transition back to this page when there is an ELEVATE on the auth interceptor
            $(".modal").modal('hide');
            $('.popover').popover('hide');
            
            if (transition._targetState._definition.self.name != transition._targetState._definition.self.name != $state.$current.name)
                $("#pageTransitioner").show();
        });
        $transitions.onSuccess({}, function () {
            $(".modal").modal('hide');
            $('.popover').popover('hide');
            $("#pageTransitioner").hide();
            delete($rootScope._transition);
        });
        $transitions.onError({}, function (transition) {
            $(".modal").modal('hide');
            $('.popover').popover('hide');
            $("#pageTransitioner").hide();
            delete($rootScope._transition);

        });
        // Get session
        SanteDB.authentication.getSessionInfoAsync().then(function (s) {
            $rootScope.session = s;
            // Extended attributes
            if (s != null && s.entity != null) {
                s.entity.telecom = s.entity.telecom || {};
                if (Object.keys(s.entity.telecom).length == 0)
                    s.entity.telecom.MobilePhone = { value: "" };
            }

            // User preferences
            if (s) {
                window.sessionStorage.setItem('token', s.access_token || s.token);
                SanteDB.configuration.getUserPreferencesAsync().then(function (prefs) {
                    $rootScope.session.prefs = {};
                    prefs.application.setting.forEach(function (e) {
                        $rootScope.session.prefs[e.key] = e.value;
                    });
                    $rootScope.$apply();
                }).catch(function (e) { });
            }
        }).catch(function (e) { $rootScope.errorHandler(e); });


        /**
         * @summary Global Error Handler
         */
        $rootScope.errorHandler = function (e) {
            console.error(e);
            var userMessageKey = `error.type.${e.$type}.userMessage`;
            var userMessage = SanteDB.locale.getString(userMessageKey);

            if(userMessage == userMessageKey) // no special user message - show default
            {
                userMessageKey = e.message + '.text';
                userMessage = SanteDB.locale.getString(userMessageKey);
                $rootScope.error = {
                    userMessage: e.userMessage ? e.userMessage : userMessage != userMessageKey ? userMessage : null,
                    details: e.detail || e,
                    message: e.message || 'ui.error.title',
                    type: e.$type,
                    rules: e.rules,
                    cause: []
                };
                var cause = e.cause;
                while (cause) {
                    $rootScope.error.cause.push({
                        detail: cause.detail || cause,
                        message: cause.message || 'ui.error.title',
                        type: cause.$type
                    });
                    cause = cause.cause;
                }
            }
            else 
                $rootScope.error = {
                    userMessage: userMessage,
                    type: e.$type
                }
            $("#errorModal").modal({ backdrop: 'static' });
            $rootScope.$apply();
        }

        // Page information
        $rootScope.page = {
            currentTime: new Date(),
            maxEventTime: new Date().tomorrow().trunc().addSeconds(-1),
            minEventType: new Date().yesterday()
        };

        // The online interval to check online state
        $interval(function () {
            $rootScope.system = $rootScope.system || {};
            $rootScope.system.online = SanteDB.application.getOnlineState();

            // Page information
            $rootScope.page = {
                currentTime: new Date(),
                maxEventTime: new Date().tomorrow().trunc().addSeconds(-1),
                minEventType: new Date().yesterday()
            };

            // Session for expiry?
            if ($rootScope.session && $rootScope.session.exp && ($rootScope.session.exp - Date.now() < 120000)) {
                var expiresIn = Math.round(($rootScope.session.exp - Date.now()) / 1000);
                var mins = Math.trunc(expiresIn / 60), secs = expiresIn % 60;
                if (("" + secs).length < 2)
                    secs = "0" + secs;
                var messageStr = `${SanteDB.locale.getString("ui.session.aboutToExpire")} ${mins}:${secs} ${SanteDB.locale.getString("ui.session.action.extend")}`;

                if (expiresIn < 0) // already expired
                    SanteDB.authentication.logoutAsync().then(function () {
                        window.sessionStorage.removeItem('token');
                        $rootScope.session = null;
                        $templateCache.removeAll();
                        $state.reload();
                        toastr.clear();
                    }).catch($rootScope.errorHandler);
                else if (!_extendToast) {
                    _extendToast = toastr.warning(messageStr, null, {
                        closeButton: false,
                        preventDuplicates: true,
                        onclick: function () {
                            SanteDB.authentication.refreshLoginAsync().then(function (s) { window.sessionStorage.setItem('token', s.access_token || s.token); $rootScope.session = s; _extendToast = null; toastr.clear(); }).catch($rootScope.errorHandler);
                        },
                        positionClass: "toast-bottom-center",
                        showDuration: "0",
                        hideDuration: "0",
                        timeOut: "0",
                        extendedTimeOut: "0"
                    });
                }
                else {
                    $($rootScope.extendToast).children('.toast-message').html(messageStr);
                }
            }
            else
                toastr.clear();

        }, 10000);

        // Set locale for sleect2
        $.fn.select2.defaults.set('language', SanteDB.locale.getLocale());

        // Fix modal scrolling
        $(document).on('hidden.bs.modal', function () {
            if ($('.modal.in').length > 0)
                $('body').addClass('modal-open');
        });

    }]);

    