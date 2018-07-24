/// <Reference path="../../core/js/santedb.js"/>
/**
 * SanteDB Root JS View
 */
var santedbApp = angular.module('santedb', ['ngSanitize', 'ui.router', 'oc.lazyLoad'])
    .config(['$compileProvider', '$stateProvider', '$urlRouterProvider', function($compileProvider, $stateProvider, $urlRouterProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(http|https|tel):/);
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(http|https):/);

        var startupAsset = false;
        SanteDB.UserInterface.states.forEach(function(state) {
            startupAsset |= state.url === '/';
            $stateProvider.state(state);
        });

        if(!startupAsset) 
            $stateProvider.state({
                name: 'santedb-index',
                url: '/',
                abstract: false,
                views: {
                    '' : {
                        controller: '',
                        templateUrl: '/org.santedb.uicore/views/default.html'
                    }
                }
            });
        $urlRouterProvider.otherwise('/');
    }])
    .run(['$rootScope','$state','$templateCache','$transitions', function($rootScope, $state, $templateCache, $transitions) {

        // Get configuration
        SanteDB.configuration.getAsync().then(function(d) {
            $rootScope.system = {};
            $rootScope.system.config = d;
            $rootScope.system.version = SanteDB.application.getVersion();
            $rootScope.$apply();
        }).catch(function(e) { console.error(e); });

        // Transitions
        $transitions.onBefore({}, function(transition) {
            console.info(`Transitioned to ${transition._targetState._definition.self.name}`);
            $("#pageTransitioner").show();
        });
        $transitions.onSuccess({}, function() {
            $("#pageTransitioner").hide();
        });
        
        // 

    }]);