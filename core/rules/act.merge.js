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
 * User: justi
 * Date: 2018-7-22
 */

/** 
 * @summary Performs redirect of any record target which has been replaced
 * @param {Act} act The act being corrected for merge
 * @returns {Act} The correct act
 */
function __ActMergeFunction(act) {
    
    act.tag = act.tag || {};
    if (!act.participation.RecordTarget ||
            act.tag["hasDuplicateFix"])
        return act;

    // Now we want to grab the record target and see if they are a merge?
    var recordTarget = act.participation.RecordTarget.player;
    SanteDB.resources.entityRelationship.find({
        target: recordTarget,
        relationshipType: OpenIZModel.EntityRelationshipTypeKeys.Replaces
    }).then(function (data) {
        if (data.totalResults === 0) return; // no replacements

        act.participation.RecordTarget.player = data.item[0].source; // Replace the target player

        }).catch(function (e) { console.error("Error fetching entity relationships from data store"); });

    if (SanteDBBre.Environment === SanteDBBre.ExecutionEnvironment.Server)
        act.tag['hasDuplicateFix'] = true;

    return act;
}

/** 
 * Before insert trigger which is used to correct acts which point at a merged record. This occurs when 
 * a bundle is persisted and the record targets point at an auto-merged record
 */
SanteDBBre.AddBusinessRule("Act", "BeforeInsert", null,
    function (act) {
        return __ActMergeFunction(act);
    });
SanteDBBre.AddBusinessRule("SubstanceAdministration", "BeforeInsert", null,
    function (act) {
        return __ActMergeFunction(act);
    });
SanteDBBre.AddBusinessRule("QuantityObservation", "BeforeInsert", null,
    function (act) {
        return __ActMergeFunction(act);
    });
SanteDBBre.AddBusinessRule("CodedObservation", "BeforeInsert", null,
    function (act) {
        return __ActMergeFunction(act);
    });
SanteDBBre.AddBusinessRule("TextObservation", "BeforeInsert", null,
    function (act) {
        return __ActMergeFunction(act);
    });
SanteDBBre.AddBusinessRule("Procedure", "BeforeInsert", null,
    function (act) {
        return __ActMergeFunction(act);
    });
SanteDBBre.AddBusinessRule("PatientEncounter", "BeforeInsert", null,
    function (act) {
        return __ActMergeFunction(act);
    });