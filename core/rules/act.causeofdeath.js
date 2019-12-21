/*
 * Copyright 2015-2019 Mohawk College of Applied Arts and Technology
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
 * User: Justin Fyfe
 * Date: 2019-8-8
 */
SanteDBBre.AddBusinessRule("CodedObservation", "AfterInsert", {
    typeConcept: "6fb8487c-cd6f-44f1-ab63-27dc65405792", // Clinical status
    value: "6df3720b-857f-4ba2-826f-b7f1d3c3adbb", //dead
    statusConcept: StatusKeys.Completed
    },
    function (act) {

    if (act.participation &&
        act.participation.RecordTarget &&
        act.participation.RecordTarget.player
        )
    {
        // Get the patient and set them as deceased
        console.info("Patient " + act.participation.RecordTarget.player + " is deceased, will mark as deceased");
        SanteDB.resources.patient.findAsync({ _id: act.participation.RecordTarget.player })
            .then(function (patient) {

                // Set the deceased date
                if (act.relationship &&
                    act.relationship.HasComponent &&
                    act.relationship.HasComponent.target) {

                    if (!act.relationship.HasComponent.targetModel)
                        SanteDB.resources.act.find({ _id: act.relationship.HasComponent.target })
                            .then(function (d) {
                                act.relationship.HasComponent.targetModel = d;
                            }).catch(function (d) {
                                console.error("Error finding act component describing date of death");
                            });

                    patient.deceasedDate = act.relationship.HasComponent.targetModel.actTime;

                }
                else
                    patient.deceasedDate = act.actTime;

                // TODO: Add a way to return a bundle from this function to do atomic operations
                SanteDB.resources.patient.updateAsync(patient.id, patient);
            }).catch(function (ex) {
                console.error("Error making patient deceased: " + (ex.message || ex));
            });
    }
    return act;
});