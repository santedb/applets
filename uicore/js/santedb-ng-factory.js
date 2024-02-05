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
                // if (window.sessionStorage.getItem('token')) {
                //     config.headers.Authorization = 'BEARER ' + window.sessionStorage.getItem('token');
                // }

                if(SanteDB.locale.getLocale())
                    config.headers["X-SdbLanguage"] = SanteDB.locale.getLocale();
                return config;
            },

            responseError: function (response) {
                // TODO: Authentication elevation - check the error_code for the appropriate errors
                if (response.status === 401) {
                    var oldState = $injector.get('$state').$current.name;
                    window.sessionStorage.removeItem("token");

                    var $state = $injector.get('$state');

                    // Ensure that we have a configuration for login
                    if(SanteDB.configuration.getRealm()) {
                        $state.go('login'); 
                    }
                    else {
                        return $q.reject(response);;
                    }
                }
                else if(response.status != 503) // Not ready - Resolve with not ready payload (HTML)
				{
					return $q.reject(response);
				}
				else 
					return $q.resolve(response);
            }
        };
    }])