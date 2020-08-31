
/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>

angular.module('santedb-lib')
    /**
     * @method provenance
     * @memberof Angular
     * @summary Renders a provenance info box
     */
    .directive('scrollSticky', ["$window", function ($window) {
        return {
            restrict: 'A',
            link: function (scope, element) {
    
                var current= $window.pageYOffset;
                var etop = $(element).offset().top;
                $(element).addClass("scrollSticky-container");
                angular.element($window).on("scroll", hideBarOnScroll);
    
                function hideBarOnScroll() {
                    var ref;
                    console.info($window.scrollY);
                    if ($window.scrollY >= etop) {
                        $(element).css({ position: 'fixed', top: '4em', left: '0', width:'100%', "z-index":100 });
                        $(element).parent().css({ height: $(element).height() });
                    } else {
                        $(element).css({ position: 'static' });
                    }
                    current = this.pageYOffset;
                    return scope.$apply();
                }
            }
        }
    }]);