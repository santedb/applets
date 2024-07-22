/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../../../../core/js/santedb-cdss.js"/>
/// <reference path="../../../../core/js/santedb-model.js"/>

angular.module('santedb-lib')
   /**
   * @summary Display and sets the result of a CDSS validation event
   * @memberof Angular
   */
   .directive('cdssInteractive', ['$timeout', function ($timeout) {


      return {
         restrict: 'A',
         link: function (scope, element, attrs, ngModel) {
            $(element).on('blur', async function() {

               try {
                  var cdssInteractiveConfig = scope.$eval(attrs.cdssInteractive);
                  var library = cdssInteractiveConfig.libraries;
                  var targetObject = cdssInteractiveConfig.target || cdssInteractiveConfig;
                  var inputName = attrs.name;
                  var form = SanteDB.display.getParentScopeVariable(scope, element[0].form.name);
                  var issues = await SanteDBCdss.analyzeAsync(new Bundle({ resource: [ targetObject ] }), true, library);
                  
                  $timeout(() => 
                  {
                     // Set the validity
                     if(inputName) {
                        form[inputName].$setValidity("cdss", !issues.find(o=>o.priority == "Error"));
                        form[inputName].$cdss = issues;
                     }


                  })
               }
               catch (e){
                  console.error("Error running CDSS", e);
               }
            });
         }
      }
   }]);