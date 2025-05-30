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

/// <reference path="../../../core/js/santedb.js" />

angular.module('santedb').controller('UserMailController', ["$scope", "$rootScope", "$stateParams", "$interval", function ($scope, $rootScope, $stateParams, $interval) {

    $scope.filter = {
        flags: '!32',
        _count: 10,
        _orderBy :"creationTime:desc"
    };

    if($stateParams.id) {
        $scope.currentMessage = { loading :  true };
        selectMessage($stateParams.id);
    }

    checkMail();

    /**
     * @summary Mail check function
     */
    async function checkMail() {
        try {
            if ($scope.filter._subject || $scope.filter.subject)
                $scope.filter.subject = `~${$scope.filter._subject}`;
            $scope.mailbox = await SanteDB.resources.mail.findAsync($scope.filter);
            $scope.$apply();
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    /**
     * @summary Sets the selected message in the UI
     * @param {string} id The identifier of the message to set
     */
    async function selectMessage(id) {
        try {
            // Try to get locally
            if ($scope.mailbox && $scope.mailbox.resource)
                $scope.currentMessage = $scope.mailbox.resource.find(o => o.id == id);
            else 
                $scope.currentMessage = await SanteDB.resources.mail.getAsync(id);

            try { $scope.$apply(); }
            catch (e) { }
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    /**
     * @summary Sets the state of a message
     * @param {string} id The id of the messgae to set state for
     * @param {numeric} state The state flag to set
     */
    async function setState(id, state) {
        try {
            var current = await SanteDB.resources.mail.getAsync(id);
            current.flags = state;
            await SanteDB.resources.mail.updateAsync(id, current);
            checkMail();
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    // ANGULAR JS BINDINGS
    var refreshInterval = $interval(() => checkMail(), 30000);
    $scope.selectMessage = function(id) {
        $scope.currentMessage = { loading: true };
        selectMessage(id);
    }
    $scope.setState = setState;
    $scope.refreshResults = checkMail;
    $scope.setFilter = function(filter)
    {
        $scope.filter = filter;
        $scope.filter._count = 10;
        $scope.filter._orderBy = "creationTime:desc";
        $scope.mailbox = { loading: true };
        checkMail();
    };


    // Destroy interval
    $scope.$on('$destroy', function () {
        if (refreshInterval)
            $interval.cancel(refreshInterval);
    });

}]);
