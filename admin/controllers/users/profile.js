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

/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('UserProfileController', ["$scope", "$rootScope", "$stateParams", function ($scope, $rootScope, $stateParams) {

    // Initialize the view
    var initializeView = async function() {

        try {
            var sessionInfo = await SanteDB.authentication.getSessionInfoAsync();

            if(sessionInfo.entity && sessionInfo.entity.id)
                $scope.userEntity = await SanteDB.resources.userEntity.getAsync(sessionInfo.entity.id, "full");
            else 
                $scope.userEntity = new UserEntity({
                    securityUser: sessionInfo.user.id,
                    language: [
                        {
                            "languageCode": SanteDB.locale.getLanguage(),
                            "isPreferred": true
                        }
                    ]
                }) ;

            var userInfo = await SanteDB.resources.securityUser.getAsync(sessionInfo.user.id);

            $scope.userEntity.securityUserModel = userInfo.entity;
            $scope.userEntity.securityUserModel.role = userInfo.role;

        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    initializeView().then(()=>$scope.$apply()).catch($rootScope.errorHandler);
}]);

