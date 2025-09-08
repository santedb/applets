/*
 * Copyright (C) 2021 - 2025, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Portions Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
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

/**
 * @class SanteDBCdssWrapper
 * @summary Provides helper functions for the CDSS
 */
function SanteDBCdssWrapper() {
 
    const _promoteFields = [
        "interpretationConcept",
        "interpretationConceptModel",
        "value",
        "unitOfMeasure",
        "unitOfMeasureModel",
        "reasonConcept",
        "reasonConceptModel",
        "negationInd",
        "extension",
        "tag",
        "policy",
        "note",
        "statusConcept",
        "statusConceptModel"
    ];

    /**
     * @method
     * @memberof SanteDBCdssWrapper
     * @summary Perform an analysis of the submitted object
     * @param {Bundle} object The bundle or the object that is to be analyzed via the CDSS
     * @param {Array} libraryIds The library identifiers which are to be used to analyze the provided object
     * @param {boolean} replaceValues True if fields which were originally populated in the object should be replaced with the CDSS value
     * @package {Array} outProposals The proposals that were generated. Set this to an empty array if you wish to capture this output
     * @returns {DetectedIssue} The detected issues from the analysie
     * @remarks The ${object} is updated with selected fields such as interpretationConcept, etc.
     */
    this.analyzeAsync = async function (object, replaceValues, libraryIds, outProposals) {
       
        try {

            // Submission needs to clear fields
            var api = null;
            if(object.$type == Bundle.name || object.resource) {
                object.resource.forEach(o => delete o.interpretationConcept);
                api = SanteDB.resources.bundle;
            }
            else {
                delete object.interpretationConcept;
                api = SanteDB.resources.act;
            }

            // Submit the bundle to the analyze endpoint
            var analysis = await api.invokeOperationAsync(null, "analyze", { target: object, libraryId: libraryIds }, null, "fastview");

            // Analysis issues 
            var issues = analysis.issue;
            var objectReturn = await api.invokeOperationAsync(null, "expand", { object: analysis.submission }, null, "noModelProperties");
            if(analysis.propose  && Array.isArray(outProposals)) {
                // Expand the data 
                var proposals = await Promise.all(analysis.propose.map(async action => {
                    return await SanteDB.resources.act.invokeOperationAsync(null, "expand", { object: action }, null, "full");
                }));
                proposals.forEach(p =>
                {
                    // If the proposal is replacing an existing component, find the component and replace it
                    if(object.$type !== Bundle.name && p.tag && p.tag["$cdss.overwriteComponent"]) {
                        object.relationship = object.relationship || {};
                        object.relationship.HasComponent = object.relationship.HasComponent || [];
                        var idx = object.relationship.HasComponent.findIndex(o => (o.target || o.targetModel.id) == p.tag["$cdss.overwriteComponent"]);
                        if(idx == -1) // not found push
                        {
                            object.relationship.HasComponent.push(p);
                        }
                        else {
                            _promoteFields.forEach(k => object.relationship.HasComponent[idx].targetModel[k] = p[k]);
                        }
                    }
                    else {
                        outProposals.push(p);
                    }
                });
            }

            // We want to update any item in the submitted object with any interpretation concept or fields that have changed 
            objectReturn.resource = objectReturn.resource || [ objectReturn ];

            objectReturn.resource.forEach(r => {
                var originalObject = object.resource?.find(o=>o.id == r.id) || object;
                if (!originalObject) return;

                // Copy any non-model fields over to 
                Object.keys(r).filter(k => _promoteFields.indexOf(k) > -1).forEach(k => {
                    var originalValue = originalObject[k];
                    var cdssValue = r[k];

                    if(!cdssValue) return;
                    else if(!originalValue) {
                        originalObject[k] = cdssValue;
                    }
                    else if(Array.isArray(originalValue)) {
                        originalObject[k].push(cdssValue);
                    }
                    else if(replaceValues) {
                        originalObject[k] = cdssValue;
                    }
                })
            });

            return issues;
        }
        catch (e) {
            console.error("Error executing CDSS", e);
            throw new Exception("CdssException", e.message, e.detail, e);
        }
    }
}

var SanteDBCdss = new SanteDBCdssWrapper();