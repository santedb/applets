/*
 * Copyright 2015-2018 Mohawk College of Applied Arts and Technology
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
 * User: justin
 * Date: 2018-7-31
 */

/**
 * @summary Represents an elevator implementation that uses the uicore elevation controls
 * @constructor
 * @class
 * @param {function():void} continueWith The function to continue with when login is successful
 */
function SanteDBElevator(continueWith) {

    var _token = null;
    var _onCloseFunction = null;

    // Focus function
    var _focusFunction = function() {};
    $("#loginModal").on("shown.bs.modal", function() { _focusFunction(); });
    $("#loginModal").on("hidden.bs.modal", function() {
        if(_onCloseFunction)
            _onCloseFunction();
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
    this.elevate = function(sessionToUse) {
        angular.element("#loginModal").scope().login = {
            userName: sessionToUse ? sessionToUse.user.userName : null,
            enablePin: sessionToUse != null,
            requirePou: sessionToUse != null,
            _lockUserName: sessionToUse != null,
            noSession: true,
            grant_type: sessionToUse ? "pin" : "password",
            onLogin: function(s) {
                _token = s.access_token || s.token;
                continueWith();
            }
        };

        // Try to refresh scope
        try {
            angular.element("#loginModal").scope().$apply();
        }
        catch (e) {

        }
        $("#loginModal").modal({
            backdrop:'static'
        });

        _focusFunction = function() {
            if(sessionToUse) 
                $("#authUserPinInput").focus();
            else 
                $("#authUserNameInput").focus();
        }
    }
}