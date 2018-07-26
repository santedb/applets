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

                        state.resolve = { 'loadState0' : ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load(view.lazy);
                        }]};
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

        
    }]).controller("RootIndexController", ["$scope", function($scope) {
        $scope.login = {
            grant_type: "password",
            requirePou: true,
            forbidPin: false
        };
    }])
    .run(['$rootScope', '$state', '$templateCache', '$transitions', '$ocLazyLoad', function ($rootScope, $state, $templateCache, $transitions, $ocLazyLoad) {

        // Localization
        SanteDB.resources.locale.findAsync().then(function(locale) {
            var localeAsset = locale[SanteDB.locale.getLocale()];
            localeAsset.forEach(function(l) {
                $.getScript(l);
            });
        }).catch(function(e) { 
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
        SanteDB.authentication.getSessionInfoAsync().then(function(s) {
            $rootScope.session = s;
        }).catch(function(e) { $rootScope.errorHandler(e); });


        /**
         * @summary Global Error Handler
         */
        $rootScope.errorHandler = function(e) {
            console.error(e);
            $rootScope.error = {
                details: e.details || e,
                message: e.message || 'ui.error.title',
                type: e.type
            };
            $("#errorModal").modal({ backdrop: 'static' });
        }
    }]);
