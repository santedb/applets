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
//if (!SanteDBBusinessIntelligence)

/**
 * @class
 * @public
 * @constructor
 * @summary Wrapper for the SanteDB BI interface. This interface is used to fetch and render business intelligence
 *          reports from the SanteDB server. 
 * @property {SanteDBBusinessIntelligence.ResourceApi} resources Provides base access to the resources in the BI engine
 */
function SanteDBBusinessIntelligence() {

    // Private variables 
    var _bis = new APIWrapper({
        base: "/bis/",
        idByQuery: false
    });

    /**
     * @constructor
     * @memberof SanteDBBusinessIntelligence
     * @class
     * @summary Provides access to the SanteDB business intelligence resources.
     * @property {ResourceWrapper} package Access to the BI Packages (collections of reports, queries, etc.)
     * @property {ResourceWrapper} dataSource Access to the data source API 
     * @property {ResourceWrapper} parameter Access to parameters for report and query definitions
     * @property {ResourceWrapper} query Access to the defined stored queries
     * @property {ResourceWrapper} report Access to reports API
     * @property {ResourceWrapper} view Access to the stored data views on the BI Server
     * @property {ResourceWrapper} format Access to report format definitions
     */
    function ResourceApi() {
        /**
         * @type {ResourceWrapper}
         * @private
         */
        this.package = new ResourceWrapper({
            resource: "BiPackage",
            api: _bis
        });
        /**
         * @type {ResourceWrapper}
         * @private
         */
        this.dataSource = new ResourceWrapper({
            resource: "BiDataSourceDefinition",
            api: _bis
        });
        /**
         * @type {ResourceWrapper}
         * @private
         */
        this.parameter = new ResourceWrapper({
            resource: "BiParameterDefinition",
            api: _bis
        });
        /**
         * @type {ResourceWrapper}
         * @private
         */
        this.query = new ResourceWrapper({
            resource: "BiQueryDefinition",
            api: _bis
        });
        /**
         * @type {ResourceWrapper}
         * @private
         */
        this.report = new ResourceWrapper({
            resource: "BiReportDefinition",
            api: _bis
        });
        /**
         * @type {ResourceWrapper}
         * @private
         */
        this.view = new ResourceWrapper({
            resource: "BiViewDefinition",
            api: _bis
        });
        /**
        * @type {ResourceWrapper}
         * @private
        */
        this.format = new ResourceWrapper({
            resource: "BiRenderFormatDefinition",
            api: _bis
        });
    };

    /**
        * @property
        * @memberof SanteDBWrapper
        * @summary Provides access to resource handlers
        */
    this.resources = new ResourceApi();


    /**
     * @method renderReportAsync
     * @memberof SanteDBBusinessIntelligence
     * @summary Renders a report on the server
     * @param id {String} Identifier of the report to run
     * @param view {String} The name of the view within the report to render
     * @param format {String} The identifier of the format to render (HTML, RTF, etc.)
     * @param parameters {Any} Parameter dictionary
     * @returns {Promise} The promise for the report rendering operation
     */
    this.renderReportAsync = function (id, view, format, parameters) {

        if (!id || !view || !format)
            throw new Exception("ArgumentNullException", "error.bi.nullArgument");

        parameters["_view"] = view;

        for (var p in parameters) {
            if (parameters[p] instanceof Date)
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
/**
 * @type {SanteDBBusinessIntelligence}
 * @global
 */
var SanteDBBi = new SanteDBBusinessIntelligence();

