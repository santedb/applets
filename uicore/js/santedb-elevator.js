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

/**
 * @summary Represents an elevator implementation that uses the uicore elevation controls
 * @constructor
 * @class
 * @param {function():void} continueWith The function to continue with when login is successful
 * @param {string} purposeOfUse The purpose of use to assign
 */
function SanteDBElevator(continueWith, purposeOfUse) {

    var _token = null;
    var _onCloseFunction = null;

    // Focus function
    var _focusFunction = function() {};
    $("#loginModal").on("shown.bs.modal", function() { _focusFunction(); });
    $("#loginModal").on("hidden.bs.modal", function() {
        if(_onCloseFunction)
            _onCloseFunction(_token != null);
        $("#loginModal").off("shown.bs.modal");
        $("#loginModal").off("hidden.bs.modal");
    });

    /**
     * @summary Sets a special function to be called when the modal is closed regardless of outcome
     * @param {function():void} closeCallback The callback to be alled
     */
    this.setCloseCallback = function(closeCallback) {
        _onCloseFunction = closeCallback;
    }

    /**
     * @method
     * @returns {String} The current elevation token
     * @summary Gets the elevation token
     */
    this.getToken = function() {
        return _token;
    }

    /**
     * @method
     * @summary Shows the elevation dialog and then performs the continueWith
     * @param {any} useSession The current session, passed when and if a pou is required and not a change of login
     */
    this.elevate = function(sessionToUse, scope) {

        angular.element("#loginModal").scope().login = {
            userName: sessionToUse ? sessionToUse.user.userName : null,
            enablePin: sessionToUse != null,
            requirePou: purposeOfUse === false ? false : purposeOfUse || scope && scope.filter(o=>o.indexOf("1.3.6.1.4.1.33349.3.1.5.9.2.600") == 0).length == 0,
            _lockUserName: sessionToUse != null,
            scope: scope,
            purposeOfUse: purposeOfUse,
            noSession: true,
            grant_type: "password",
            onLogin: function(s) {
                _token = s.access_token || s.token;
                continueWith(s);
            }
        };

        // Try to refresh scope
        try {
            angular.element("#loginModal").scope().$apply();
        }
        catch (e) {

        }

        __SanteDBAppService.GetStatus().then(o=>{
            $("#loginModal").modal({
                backdrop:'static'
            });
        });

        _focusFunction = function() {
            if(sessionToUse) 
                $("#authUserPinInput").focus();
            else 
                $("#authUserNameInput").focus();
        }
    }
}

