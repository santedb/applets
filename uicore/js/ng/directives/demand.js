/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>
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
angular.module('santedb-lib')
/**
 * @summary Directive for demanding a policy permission in order to be able to view an element.
 */
.directive('demand', [function () {

    // Async wrapper function
    async function setElementState(element, policy) {
        try {
            var demandResult = await SanteDB.authentication.demandAsync(policy);
            switch(demandResult) {
                case SanteDB.authentication.PolicyDecision.Deny: // deny
                    $(element).attr('disabled','disabled');
                    break;
                case SanteDB.authentication.PolicyDecision.Elevate: // elevate (TODO: provide unlock elevate button)
                    break;
                case SanteDB.authentication.PolicyDecision.Grant: // grant
                    $(element).removeAttr('disabled');
                    break;
            }
        }
        catch(e) {
            console.info(`Policy demand failed - ${e}`);
            $(element).attr('disabled','disabled');
        }
    }

    return {
        restrict: 'A',
        link: function (scope, element, attrs, ngModel) {
            setElementState(element, attrs.demand);
        }
    }
}]);