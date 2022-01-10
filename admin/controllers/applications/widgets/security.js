/// <reference path="../../../../core/js/santedb.js"/>
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
 */
angular.module('santedb').controller('EditApplicationSecurityController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", function ($scope, $rootScope, $state, $templateCache, $stateParams) {

    /**
     * @summary Reset invalid logins
     */
     $scope.resetInvalidLogins = async function(application) {
        if(!confirm(SanteDB.locale.getString("ui.admin.applications.invalidLogin.reset")))
            return;

        try {
            var patch = new Patch({
                change: [
                    new PatchOperation({
                        op: PatchOperationType.Replace,
                        path: "invalidAuth",
                        value: 0
                    })
                ]
            });

            SanteDB.display.buttonWait("#resetInvalidLoginButton", true);
            await SanteDB.resources.securityApplication.patchAsync($stateParams.id, application.securityApplication.etag, patch)
            application.securityApplication.invalidAuth = 0;
        }
        catch (e) {
            $rootScope.errorHandler(e);
            SanteDB.display.buttonWait("#resetInvalidLoginButton", false);
        }
        finally {
            SanteDB.display.buttonWait("#resetInvalidLoginButton", false);
        }
    }

    
     /**
     * @summary Unlock user
     */
      $scope.unlock = async function() {
        if(!confirm(SanteDB.locale.getString("ui.admin.applications.confirmUnlock")))
            return;

        try {
            SanteDB.display.buttonWait("#unlockButton", true);
            await SanteDB.resources.securityApplication.unLockAsync($stateParams.id);
            $scope.scopedObject.securityApplication.lockout = null;

            try {
                $scope.$apply();
            } catch(e) {}
        }
        catch (e) {
            $rootScope.errorHandler(e);
            SanteDB.display.buttonWait("#unlockButton", false);
        }
        finally {
            SanteDB.display.buttonWait("#unlockButton", false);
        }
    }

    /**
     * @summary Reset secret
     */
         $scope.resetSecret = async function(application) {
            if(application.securityApplication.id && !confirm(SanteDB.locale.getString("ui.admin.applications.secret.reset")))
                return;
    
            try {
                // Generate UUID
                var repl = SanteDB.application.generatePassword();
                var patch = new Patch({
                    change: [
                        new PatchOperation({
                            op: PatchOperationType.Replace,
                            path: "applicationSecret",
                            value: repl
                        })
                    ]
                });
    
                SanteDB.display.buttonWait("#resetSecretButton", true);
                await SanteDB.resources.securityApplication.patchAsync($stateParams.id, application.securityApplication.etag, patch);
                application.securityApplication.applicationSecret = repl;

                try {
                    $scope.$apply();
                } catch(e) {}
            }
            catch(e) {
                SanteDB.display.buttonWait("#resetSecretButton", false);
                $rootScope.errorHandler(e); 
            }
            finally {
                SanteDB.display.buttonWait("#resetSecretButton", false);
            }
        }
  
}]);