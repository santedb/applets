/// <reference path="../../../core/js/santedb.js"/>
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
 */
angular.module('santedb').controller('PubSubEditController', ["$scope", "$rootScope", "$stateParams", "$timeout", '$state', function ($scope, $rootScope, $stateParams, $timeout, $state) {

    
    // Initialize the view
    async function initializeView() {
        try {
            var subscription = null;
            if ($stateParams.id == 'new') {
                subscription = {
                    $type: "PubSubSubscriptionDefinition",
                    when: [ ''],
                    channelModel : {
                        $type: "PubSubChannelDefinition",
                        settings: []
                    }
                }
            }
            else {
                subscription = await SanteDB.resources.pubSubSubscriptionDefinition.getAsync($stateParams.id);
                subscription.channelModel = await SanteDB.resources.pubSubChannelDefinition.getAsync(subscription.channel);
                document.title = document.title + " - " + subscription.name;

                // Trim off the full AQN so only the first sections (name and assembly name are present in the selection list - as versions changed between the 
                // time that the subscription is defined and the actual version this request is made on)
                subscription.eventModel = {};
                subscription.event.split(',').forEach(o=>subscription.eventModel[o.trim()] = true);
                for(var i in subscription.when) {
                    subscription.when[i] = decodeURI(subscription.when[i]);
                }
            }

            // Get dispatchers
            var dispatchers = await SanteDB.resources.pubSubSubscriptionDefinition.invokeOperationAsync(null, "dispatcher", null, true);


            $timeout(() => {
                $scope.subscription = subscription;
                $scope.dispatchers = dispatchers.values;
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    initializeView();


    // Save subscription
    $scope.saveSubscription = async function(form) {

        if(!form.$valid) { return; }

        try {
            SanteDB.display.buttonWait("#btnSave", true);

            if($scope.subscription.when) {
                $scope.subscription.when = [ $scope.subscription.when.filter(o=>o!='').reduce((a,b)=> `${a}&${b}`) ];
            }
            $scope.subscription.event = Object.keys($scope.subscription.eventModel).filter(o=>$scope.subscription.eventModel[o] === true).join(", ");
            $scope.subscription.channelModel.name = `Channel for ${$scope.subscription.name}`;
            // Are we inserting or updating?
            if($scope.subscription.id) {
                await SanteDB.resources.pubSubChannelDefinition.updateAsync($scope.subscription.channelModel.id, $scope.subscription.channelModel);
                await SanteDB.resources.pubSubSubscriptionDefinition.updateAsync($scope.subscription.id, $scope.subscription);
            }
            else {
                var channel = await SanteDB.resources.pubSubChannelDefinition.insertAsync($scope.subscription.channelModel);
                $scope.subscription.channel = channel.id;
                var subscription = await SanteDB.resources.pubSubSubscriptionDefinition.insertAsync($scope.subscription);
            }

            toastr.success(SanteDB.locale.getString("ui.admin.pubsub.save.success", { name: $scope.subscription.name }));
            $state.go("santedb-admin.system.pubsub.index");
        }
        catch(e) {
            toastr.error(SanteDB.locale.getString("ui.admin.pubsub.save.error", { name: $scope.subscription.name, reason: e.message }));
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnSave", false);

        }
    };
}])