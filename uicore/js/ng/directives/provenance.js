/*
 * Copyright 2015-2019 Mohawk College of Applied Arts and Technology
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
 * User: Justin Fyfe
 * Date: 2019-8-8
 */

/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>
var provControlId = 0;
angular.module('santedb-lib')
    /**
     * @method provenance
     * @memberof Angular
     * @summary Renders a provenance info box
     */
    .directive("provenance", ['$timeout', function ($timeout) {

        var alreadyFetching = [];
        var uiqueId = 0;
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/provenance.html',
            scope: {
                provenanceId: '<',
                provenanceTime: '<',
                sessionfn: "<"
            },
            link: function (scope, element, attrs) {

                var provControl = provControlId++;
                $(element).attr('id', `prov${provControl}`);
                // correct time from string (sometimes this happens when using in a data table as the row is presented as a string)
                if(Object.prototype.toString.call(scope.provenanceTime) == '[object String]' )
                    scope.provenanceTime = new Date(scope.provenanceTime);

                if (alreadyFetching.indexOf(scope.provenanceId) == -1) // Not yet fetching
                {
                    scope.isLoading = true;
                    alreadyFetching.push(scope.provenanceId);

                    // Fetch provenance
                    SanteDB.resources.securityProvenance.getAsync(scope.provenanceId, null, null, null, provControl)
                        .then(function (provData) {
                            alreadyFetching.splice(alreadyFetching.indexOf(provData.id), 1);
                            scope.isLoading = false;
                            scope.provData = provData;

                            // Construct a popover of extra info
                            var extraInfo = "";
                            if(provData.userModel != null)
                                extraInfo += `<br/><b><i class='fas fa-user'></i> ${SanteDB.locale.getString('ui.provenance.user')}:</b> ${provData.userModel.userName}`;
                            if (provData.applicationModel != null)
                                extraInfo += `<br/><b><i class='fas fa-window-maximize'></i> ${SanteDB.locale.getString('ui.provenance.application')}:</b> ${provData.applicationModel.name}`;
                            if (scope.provenanceTime)
                                extraInfo += `<br/><b><i class='fas fa-clock'></i> ${SanteDB.locale.getString('ui.provenance.timestamp')}:</b>  ${moment(scope.provenanceTime).format(SanteDB.locale.dateFormats.second)}`;
                            if (provData.session)
                                extraInfo += `<br/><b><i class='fas fa-asterisk'></i>  ${SanteDB.locale.getString('ui.provenance.session')}:</b> ${provData.session.substring(0, 8)}`;
                            extraInfo = extraInfo.substring(5);
                            
                            //scope.$apply();
                            $timeout(function () {
                                $(`#prov${provData.$state} button:first`).attr('data-content', extraInfo);
                                $(`#prov${provData.$state} button:first`).popover({ html: true });
                            });

                            // Set the scope of all elements
                            $(`div.prv_${scope.provenanceId}`).each(function (i, e) {
                                if (e == $(element)[0]) return;
                                $(e).removeClass(`prv_${scope.provenanceId}`);

                                var sscope = angular.element(e).isolateScope();
                                sscope.provData = provData;
                                sscope.isLoading = false;
                                sscope.$apply();
                                $timeout(function () {
                                    $('button:first', e).attr('data-content', extraInfo);
                                    $('button:first', e).popover({ html: true });
                                });

                            });


                        }).catch(function (e) {
                            alreadyFetching.splice(alreadyFetching.indexOf(scope.provenanceId), 1);
                            scope.isLoading = false;
                            var provData = scope.provData = { "userModel": { "userName": "$R" }};
                            scope.error = true;

                            var extraInfo = "";
                            if(provData.userModel != null)
                                extraInfo += `<b><i class='fas fa-user'></i> ${SanteDB.locale.getString('ui.provenance.user')}:</b> ${provData.userModel.userName}`;
                            if (scope.provenanceTime)
                                extraInfo += `<br/><b><i class='fas fa-clock'></i> ${SanteDB.locale.getString('ui.provenance.timestamp')}:</b>  ${moment(scope.provenanceTime).format(SanteDB.locale.dateFormats.second)}`;

                            try {
                                scope.$apply();
                                $timeout(function () {
                                    $('button:first', element).attr('data-content', extraInfo);
                                    $('button:first', element).popover({ html: true });
                                });

                                // Set the scope of all elements
                                $(`div.prv_${scope.provenanceId}`).each(function (i, e) {
                                    if (e == $(element)[0]) return;
                                    $(e).removeClass(`prv_${scope.provenanceId}`);

                                    var sscope = angular.element(e).isolateScope();
                                    sscope.provData = provData;
                                    sscope.isLoading = false;
                                    sscope.$apply();
                                    $timeout(function () {
                                        $('button:first', e).attr('data-content', extraInfo);
                                        $('button:first', e).popover({ html: true });
                                    });

                                });
                            }
                            catch (e) {}
                        })
                }
                else {
                    scope.isLoading = true;
                    $(element).addClass(`prv_${scope.provenanceId}`);
                }
            }
        }
    }]);