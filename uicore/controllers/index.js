/// <Reference path="../../core/js/santedb.js"/>
/**
 * SanteDB Root JS View
 */
var santedbApp = angular.module('santedb', ['ngSanitize', 'ui.router', 'oc.lazyLoad', 'santedb-lib'])
    .config(['$compileProvider', '$stateProvider', '$urlRouterProvider', function ($compileProvider, $stateProvider, $urlRouterProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(http|https|tel):/);
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(http|https):/);

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
    .run(['$rootScope', '$state', '$templateCache', '$transitions', '$ocLazyLoad', '$interval', function ($rootScope, $state, $templateCache, $transitions, $ocLazyLoad, $interval) {

        // Extend toast information
        var _extendToast = null;

        // Localization
        SanteDB.resources.locale.findAsync().then(function (locale) {
            var localeAsset = locale[SanteDB.locale.getLocale()];
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
            $rootScope.$apply();
        }).catch(function (e) { $rootScope.errorHandler(e); });

        // Transitions
        $transitions.onBefore({}, function (transition) {
            console.info(`Transitioned to ${transition._targetState._definition.self.name}`);
            $("#pageTransitioner").show();
        });
        $transitions.onSuccess({}, function () {
            $("#pageTransitioner").hide();
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
            SanteDB.configuration.getUserPreferencesAsync().then(function(prefs) {
                $rootScope.session.prefs = {};
                prefs.application.setting.forEach(function(e) {
                    $rootScope.session.prefs[e.key] = e.value;
                });
                $rootScope.$apply();
            }).catch(function(e) {});
        }).catch(function (e) { $rootScope.errorHandler(e); });


        /**
         * @summary Global Error Handler
         */
        $rootScope.errorHandler = function (e) {
            console.error(e);
            $rootScope.error = {
                details: e.details || e,
                message: e.message || 'ui.error.title',
                type: e.type
            };
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
            $rootScope.system.online = SanteDB.application.getOnlineState();

            // Page information
            $rootScope.page = {
                currentTime: new Date(),
                maxEventTime: new Date().tomorrow().trunc().addSeconds(-1),
                minEventType: new Date().yesterday()
            };

            // Session for expiry?
            if ($rootScope.session && $rootScope.session.exp && ($rootScope.session.exp - Date.now < 120000)) {
                var expiresIn = Math.round(($rootScope.session.exp - Date.now) / 1000);
                var mins = Math.trunc(expiry / 60), secs = expiry % 60;
                if (("" + secs).length < 2)
                    secs = "0" + secs;
                var messageStr = `${SanteDB.locale.getString("ui.session.aboutToExpire")} ${mins}:${secs} ${SanteDB.locale.getString("ui.session.action.extend")}`;

                if (expiry < 0) // abandon the session
                    SanteDB.authentication.logoutAsync().then(function () {
                        $rootScope.session = null;
                        $templateCache.removeAll();
                        $state.reload();
                        toastr.clear();
                    }).catch($rootScope.errorHandler);
                else if (!$rootScope.extendToast) {
                    _extendToast = toastr.warn(messageStr, {
                        closeButton: false,
                        preventDuplicates: true,
                        onclick: function () {
                            SanteDB.authentication.refreshLoginAsync().then(function (s) { $rootScope.session = s; _extendToast = null; toastr.clear(); }).catch($rootScope.errorHandler);
                        },
                        positionClass: "toast-bottom-center",
                        timeOut: 0,
                        extendedTimeout: 0
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
        $(document).on('hidden.bs.modal', function() {
            if($('.modal.in').length > 0)
                $('body').addClass('modal-open');
        });

    }]);
