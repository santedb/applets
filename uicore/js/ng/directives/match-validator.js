
angular.module('santedb-lib')
    /**
     * Validator that indicates the value must match another value
     */
    .directive('matchValidator', function() {
        return {
            require: '?ngModel',
            link: function(scope, elm, attrs, ctrl) {
                var sourceInput = attrs["matchValidator"];
                if(ctrl && !ctrl.$validators.match) {
                    ctrl.$validators.match = function(modelValue) {
                        return ctrl.$$parentForm[sourceInput].$modelValue == modelValue;
                    }
                }
            }
        }
    });