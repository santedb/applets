/// <reference path="../../core/js/santedb.js"/>
/// <reference path="../../core/js/santedb-model.js"/>
/*
 * Portions Copyright 2015-2019 Mohawk College of Applied Arts and Technology
 * Portions Copyright 2019-2019 SanteSuite Contributors (See NOTICE)
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
 * Date: 2019-12-10
 */
if (!SanteDBBusinessIntelligence)
    function SanteDBBusinessIntelligence() {

        // Private variables 
        var _bis = new SanteDB.APIWrapper({
            base: "/bis/",
            idByQuery: false
        });

        // Extend the SanteDB core js
        var _resources = {
            /**
             * @property {SanteDB.ResourceWrapper}
             * @summary A resource wrapper for BI packages
             * @memberof SanteDBWrapper.resources
             */
            package: new SanteDB.ResourceWrapper({
                resource: "BiPackage",
                api: _bis
            }),
            /**
             * @property {SanteDB.ResourceWrapper}
             * @summary A resource wrapper for BI data sources
             * @memberof SanteDBWrapper.resources
             */
            dataSource: new SanteDB.ResourceWrapper({
                resource: "BiDataSourceDefinition",
                api: _bis
            }),
            /**
             * @property {SanteDB.ResourceWrapper}
             * @summary A resource wrapper for BI parameters
             * @memberof SanteDBWrapper.resources
             */
            parameter: new SanteDB.ResourceWrapper({
                resource: "BiParameterDefinition",
                api: _bis
            }),
            /**
             * @property {SanteDB.ResourceWrapper}
             * @summary A resource wrapper for BI queries
             * @memberof SanteDBWrapper.resources
             */
            query: new SanteDB.ResourceWrapper({
                resource: "BiQueryDefinition",
                api: _bis
            }),
            /**
             * @property {SanteDB.ResourceWrapper}
             * @summary A resource wrapper for BI reports
             * @memberof SanteDBWrapper.resources
             */
            report: new SanteDB.ResourceWrapper({
                resource: "BiReportDefinition",
                api: _bis
            }),
            /**
             * @property {SanteDB.ResourceWrapper}
             * @summary A resource wrapper for BI views
             * @memberof SanteDBWrapper.resources
             */
            view: new SanteDB.ResourceWrapper({
                resource: "BiViewDefinition",
                api: _bis
            }),
            /**
            * @property {SanteDB.ResourceWrapper}
            * @summary A resource wrapper for BI formats
            * @memberof SanteDBWrapper.resources
            */
            format: new SanteDB.ResourceWrapper({
                resource: "BiRenderFormatDefinition",
                api: _bis
            })
        };

        /**
            * @property
            * @memberof SanteDBWrapper
            * @summary Provides access to resource handlers
            */
        this.resources = _resources;

        
        /**
         * @method 
         * @memberof SanteDBBusinessIntelligence
         * @summary Renders a report on the server
         * @param id {String} Identifier of the report to run
         * @param view {String} The name of the view within the report to render
         * @param format {String} The identifier of the format to render (HTML, RTF, etc.)
         * @param parameters {Any} Parameter dictionary
         * @returns {Promise} The promise for the report rendering operation
         */
        this.renderReportAsync = function (id, view, format, parameters) {

            if(!id || !view || !format) 
                throw new Exception("ArgumentNullException", "error.bi.nullArgument");
            
            parameters["_view"] = view;

            for(var p in parameters) 
            {
                if(parameters[p] instanceof Date)
                    parameters[p] = moment(parameters[p]).toISOString();
            }

            var url = `Report/${format}/${id}`;
            return _bis.getAsync({
                resource: url,
                query: parameters,
                dataType: "html"
            });
        }
    }

// BI Functions
if(!SanteDBBi)
    var SanteDBBi = new SanteDBBusinessIntelligence();
