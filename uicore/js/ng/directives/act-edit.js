/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../../../../core/js/santedb-model.js"/>
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

angular.module('santedb-lib')
   /**
   * @summary Core editing of acts - and their components using their registered templates and forms
   * @memberof Angular
   * @example
   *    <act-edit 
   *        act="act_to_edit" // bi-directional binding
   *        no-add="true|false" // not-bound
   *        no-remove="true|false" // not-bound
   *        no-override="true|false" // not-bound
   *        no-header="true|false" // not bound
   *        disable-cdss="true|false" // not-bound
   *        owner-form="form_that_own" // one-way binding
   *        readonly="true|false" // not-bound 
   *    />
   */
  .directive('actEdit', ['$timeout', function ($timeout) {

    var _mode = 'edit', _noCdss = false;

    return {
        restrict: 'E',
        replace: true,
        templateUrl: './org.santedb.uicore/directives/actEdit.html',
        scope: {
            model: '=',
            ownerForm: '<',
            cdssValidationCallback: '<'
        },
        controller: ['$scope', '$rootScope', function($scope, $rootScope) {


            $scope.resolveTemplate = function(templateId) {

                var templateValue = _mode == 'edit' ? SanteDB.application.resolveTemplateForm(templateId) : SanteDB.application.resolveTemplateView(templateId);
                if(templateValue == null) {
                    return  "/org.santedb.uicore/partials/act/noTemplate.html"
                }
                return templateValue;
            }
        }],
        link: function(scope, element, attrs) {

            if(attrs.noAdd) {
                $("div.actAddItem", element).remove();
            }
            if(attrs.noRemove) {
                $("div.actRemoveItem", element).remove();
            }
            if(attrs.noOverride) {
                $("div.actProposeControl", element).remove();
            }
            if(attrs.noHeader) {
                $("div.actHeader", element).remove();
            }

            // Are we viewing or editing?
            _mode = attrs.readonly === true ? 'view' : 'edit';
            _noCdss = attrs.disableCdss;

            if(scope.model.templateModel && scope.model.templateModel.mnemonic) {
                if(_mode == 'edit') {
                    scope.model.$templateUrl = SanteDB.application.resolveTemplateForm(scope.model.templateModel.mnemonic);
                }
                else {
                    scope.model.$templateUrl = SanteDB.application.resolveTemplateView(scope.model.templateModel.mnemonic);
                }
            }
        }
    }
  }]);
