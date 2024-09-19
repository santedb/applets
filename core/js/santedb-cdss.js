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

/**
 * @class SanteDBCdssWrapper
 * @summary Provides helper functions for the CDSS
 */
function SanteDBCdssWrapper() {
 
    const _promoteFields = [
        "interpretationConcept",
        "value",
        "unitOfMeasure",
        "reasonConcept",
        "negationInd",
        "extension",
        "tag",
        "policy",
        "note",
        "statusConcept"
    ];

    /**
     * @method
     * @memberof SanteDBCdssWrapper
     * @summary Perform an analysis of the submitted object
     * @param {Bundle} object The bundle or the object that is to be analyzed via the CDSS
     * @param {Array} libraryIds The library identifiers which are to be used to analyze the provided object
     * @param {boolean} replaceValues True if fields which were originally populated in the object should be replaced with the CDSS value
     * @returns {DetectedIssue} The detected issues from the analysie
     * @remarks The ${object} is updated with selected fields such as interpretationConcept, etc.
     */
    this.analyzeAsync = async function (object, replaceValues, libraryIds) {
        if (object.$type !== "Bundle") {
            throw new Exception("ArgumentException", "Object must be a bundle");
        }

        try {

            // Submit the bundle to the analyze endpoint
            var analysis = await SanteDB.resources.bundle.invokeOperationAsync(null, "analyze", { target: object, libraryId: libraryIds }, null, "fastview");

            // Analysis issues 
            var issues = analysis.issue;
            var objectReturn = analysis.submission;

            // We want to update any item in the submitted object with any interpretation concept or fields that have changed 
            objectReturn.resource.forEach(r => {
                var originalObject = object.resource.find(o=>o.id == r.id);
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