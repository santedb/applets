
/// <reference path="./santedb-ui.js"/>
/// <reference path="../../core/js/santedb.js"/>

angular.module('santedb-lib')
    /**
     * @method AuthInterceptor
     * @memberOf Angular
     * @summary Authentication interceptor that looks for 401 unauthorized messages and redirects to the login state
     */
    .factory('AuthInterceptor', ['$rootScope', '$q', '$window', '$location', '$injector', function ($rootScope, $q, $window, $location, $injector) {
        return {
            request: function (config) {
                config.headers = config.headers || {};
                if (window.sessionStorage.getItem('token')) {
                    config.headers.Authorization = 'BEARER ' + window.sessionStorage.getItem('token');
                }
                return config;
            },

            responseError: function (response) {
                if (response.status === 401) {
                    var oldState = $injector.get('$state').$current.name;
                    $injector.get('$state').transitionTo('login', {
                        returnState: oldState == "login" ? null : (oldState || $rootScope._transition)
                    });
                    window.sessionStorage.removeItem('token');// obvi this token doesn't work
                    return $q.reject(response);;
                }
                return $q.reject(response);
            }
        };
    }])