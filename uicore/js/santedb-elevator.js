/**
 * @summary Represents an elevator implementation that uses the uicore elevation controls
 * @constructor
 * @class
 * @param {function():void} continueWith The function to continue with
 */
function SanteDBElevator(continueWith) {

    var _token = null;

    // Focus function
    var _focusFunction = function() {};
    $("#loginModal").on("shown.bs.modal", function() { _focusFunction(); });

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
            grant_type: sessionToUse ? "pin" : "password",
            onLogin: function(s) {
                _token = s.id;
                continueWith();
            }
        };
        angular.element("#loginModal").scope().$apply();
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