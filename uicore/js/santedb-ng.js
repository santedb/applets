/// <reference path="../../core/js/santedb.js"/>
/// <reference path="./santedb-ui.js"/>

angular.module('santedb-lib', [])
    /**
     * @method i18n
     * @memberof Angular
     * @summary Renders a localized string
     */
    .filter('i18n', function() {
        return function(value) {
            return SanteDB.locale.getString(value);
        }
    })
    /**
     * @method identifier
     * @memberof Angular
     * @summary Renders a model value which is an EntityIdentifier in a standard way
     * @see {SanteDBModel.EntityIdentifier}
     * @example
     *      <div class="col-md-2">{{ patient.identifier | identifier }}</div>
     */
    .filter('identifier', function () {
        return function (modelValue) {
            if (modelValue === undefined)
                return "";
            if (modelValue.NID !== undefined)
                return modelValue.NID.value;
            else
                for (var k in modelValue)
                    return modelValue[k].value;
        };
    })
    /**
     * @method concept
     * @memberof Angular
     * @summary Renders a model concept into a standard display using the concept's display name
     * @see {SanteDBModel.Concept}
     * @example
     *      <div class="col-md-2">Gender:</div>
     *      <div class="col-md-2">{{ patient.genderConceptModel | concept }}</div>
     */
    .filter('concept', function () {
        return function (modelValue) {
            return SanteDB.display.renderConcept(modelValue);
        }
    })
    /**
     * @method name
     * @memberof Angular
     * @summary Renders an entity name to the display
     * @see {SanteDBModel.EntityName}
     * @param {string} nameType The type of name to render if the name is an array of names
     * @example
     *      <div class="col-md-2">Common Name:</div>
     *      <div class="col-md-2">{{ patient.name | name: 'OfficialRecord' }}</div>
     */
    .filter('name', function() {
        return function(modelValue, type) {
            return SanteDB.display.renderEntityName(modelValue, type);
        }
    })
    /**
     * @method address
     * @memberof Angular
     * @summary Renders an entity address to the display
     * @see {SanteDBModel.EntityAddress}
     * @param {string} type The type of address to render if the name is an array of names
     * @example
     *      <div class="col-md-2">Home Address:</div>
     *      <div class="col-md-2">{{ patient.address | address: 'Home' }}</div>
     */
    .filter('address', function() {
        return function(modelValue, type) {
            return SanteDB.display.renderEntityAddress(modelValue, type);
        }
    })
    /**
     * @method extDate
     * @memberof Angular
     * @summary Renders an extended date with a specified precision
     * @param {string} precision The precision of the date to render
     * @example
     *      <div class="col-md-2">Date Of Birth:</div>
     *      <div class="col-md-2">{{ patient.dateOfBirth | extDate: patient.dateOfBirthPrecision }}</div>
     */
    .filter('extDate', function() {
        return function(date, precision) {
            var dateFormat;

            switch (precision) {
                case 1:   // Year     "Y"
                case 'Y':
                    dateFormat = SanteDB.locale.dateFormats.year;
                    break;
                case 2:   // Month    "m"
                case 'm':
                    dateFormat = SanteDB.locale.dateFormats.month;
                    break;
                case 3:   // Day      "D"
                case 'D':
                    dateFormat = SanteDB.locale.dateFormats.day;
                    break;
                case 4:   // Hour     "H"
                case 'H':
                    dateFormat = SanteDB.locale.dateFormats.hour;
                    break;
                case 5:   // Minute   "M"
                case 'M':
                    dateFormat = SanteDB.locale.dateFormats.minute;
                    break;
                case 6:   // Second   "S"
                case 'S':
                case 0:   // Full     "F"
                case 'F':
                default:
                    dateFormat = SanteDB.locale.dateFormats.second;
                    break;
            }

            if (date) {
                // Non timed
                switch (format) {
                    case 1:   // Year, Month, Day always expressed in UTC for Javascript will take the original server value and adjust.
                    case 'Y':
                    case 2:
                    case 'm':
                    case 3:
                    case 'D':
                        return moment(date).utc().format(dateFormat);
                    default:
                        return moment(date).format(dateFormat);
                }
            }

            return null;
        } 
    })



    /**
     * @method entitySearch
     * @memberof Angular
     * @summary Binds a select2 search box to the specified select input searching for the specified entities
     * @description This class is the basis for all drop-down searches in disconnected client. It is used whenever you would like to have a search inline in a form and displayed nicely
     * @param {string} value The type of object to be searched
     * @param {string} filter The additional criteria by which results should be filtered
     * @param {string} data-searchField The field which should be searched on. The default is name.component.value
     * @param {string} data-default The function which returns a list of objects which represent the default values in the search
     * @param {string} data-groupBy The property which sets the grouping for the results in the drop-down display
     * @param {string} data-groupDisplay The property on the group property which is to be displayed
     * @param {string} data-resultField The field on the result objects which contains the result
     * @example
     * <entity-search type="Place" 
                    class="form-control" 
                    name="subscribeFacility" 
                    ng-model="config.subscription.facility" 
                    filter='{ "statusConcept.mnemonic" : "ACTIVE" }'/>
     */
    .directive('entitySearch', function ($timeout) {
        return {
            scope: {
                defaultResults: '='
            },
            link: function (scope, element, attrs, ctrl) {
                $timeout(function () {
                    var modelType = attrs.entitySearch || attrs.type;
                    var filterString = attrs.filter;
                    var displayString = attrs.display;
                    var searchProperty = attrs.searchfield || "name.component.value";
                    var defaultResults = attrs.default;
                    var groupString = attrs.groupBy;
                    var groupDisplayString = attrs.groupDisplay;
                    var resultProperty = attrs.resultfield || "id";
                    var filter = {}, defaultFilter = {};
                    if (filterString !== undefined)
                        filter = JSON.parse(filterString);

                    if (modelType != "SecurityUser" && modelType != "SecurityRole")
                        filter.statusConcept = 'C8064CBD-FA06-4530-B430-1A52F1530C27';

                    // Bind select 2 search
                    $(element).select2({
                        defaultResults: function () {
                            var s = scope;
                            if (defaultResults) {
                                try {
                                    return eval(defaultResults);
                                } catch (e) {

                                }
                            }
                            else {
                                return $.map($('option', element[0]), function (o) {
                                    return { "id": o.value, "text": o.innerText };
                                });
                            }
                        },
                        dataAdapter: $.fn.select2.amd.require('select2/data/extended-ajax'),
                        ajax: {
                            url: ((modelType == "SecurityUser" || modelType == "SecurityRole") ? "/__ami/" : "/__hdsi/") + modelType,
                            dataType: 'json',
                            delay: 500,
                            method: "GET",
                            data: function (params) {
                                filter[searchProperty] = "~" + params.term;
                                filter["_count"] = 20;
                                filter["_offset"] = 0;
                                filter["_viewModel"] = "min";
                                return filter;
                            },
                            processResults: function (data, params) {
                                //params.page = params.page || 0;
                                var data = data.$type == "Bundle" ? data.item : data.item || data;
                                var retVal = { results: [] };

                                if (groupString == null && data !== undefined) {
                                    retVal.results = retVal.results.concat($.map(data, function (o) {
                                        var text = "";
                                        if (displayString) {
                                            scope = o;
                                            text = eval(displayString);
                                        }
                                        else if (o.name !== undefined) {
                                                text = SanteDB.display.renderEntityName(o.name);
                                        }
                                        o.text = o.text || text;
                                        o.id = o[resultProperty];
                                        return o;
                                    }));
                                }
                                else {
                                    // Get the group string
                                    for (var itm in data) {
                                        // parent obj
                                        try {
                                            var scope = eval('data[itm].' + groupString);
                                            var groupDisplay = "";
                                            if (groupDisplayString != null)
                                                groupDisplay = eval(groupDisplayString);
                                            else
                                                groupDisplay = scope;

                                            var gidx = $.grep(retVal.results, function (e) { return e.text == groupDisplay });
                                            if (gidx.length == 0)
                                                retVal.results.push({ "text": groupDisplay, "children": [data[itm]] });
                                            else
                                                gidx[0].children.push(data[itm]);
                                        }
                                        catch (e) {
                                            retVal.results.push(data[itm]);
                                        }
                                    }
                                }
                                return retVal;
                            },
                            cache: true
                        },
                        escapeMarkup: function (markup) { return markup; }, // Format normally
                        minimumInputLength: 2,
                        templateSelection: function (selection) {
                            var retVal = "";
                            switch (modelType) {
                                case "UserEntity":
                                case "Provider":
                                case "Patient":
                                    retVal += "<i class='fa fa-user'></i>";
                                    break;
                                case "Material":
                                case "ManufacturedMaterial":
                                    retVal += "<i class='fa fa-flask'></i>";
                                    break;
                                case "Place":
                                    retVal += "<i class='fa fa-map-pin'></i>";
                                    break;
                                case "Entity":
                                    retVal += "<i class='fa fa-share-alt'></i>";
                                    break;
                            }
                            retVal += "&nbsp;";


                            if (displayString != null) {
                                var scope = selection;
                                retVal += eval(displayString);
                            }
                            else if (selection.name != null && selection.name.OfficialRecord != null)
                                retVal += SanteDB.display.renderEntityName(selection.name.OfficialRecord);
                            else if (selection.name != null && selection.name.Assigned != null)
                                retVal += SanteDB.display.renderEntityName(selection.name.Assigned);
                            else if (selection.name != null && selection.name.$other != null)
                                retVal += SanteDB.display.renderEntityName(selection.name.$other);
                            else if (selection.element !== undefined)
                                retVal += selection.element.innerText.trim();
                            else if (selection.text)
                                retVal += selection.text;

                            if (selection.address)
                                    retVal += " - <small>(<i class='fa fa-map-marker'></i> " + SanteDB.display.renderEntityAddress(selection.address) + ")</small>";
                            return retVal;
                        },
                        keepSearchResults: true,
                        templateResult: function (result) {
                            if (result.loading) return result.text;

                            if (displayString != null) {
                                var scope = result;
                                return eval(displayString);
                            }
                            else if (result.classConcept != EntityClassKeys.ServiceDeliveryLocation && result.name != null && result.typeConceptModel != null && result.typeConceptModel.name != null && result.name.OfficialRecord) {
                                retVal = "<div class='badge badge-info'>" +
                                    SanteDB.display.renderConcept(result.typeConceptModel) + "</div> " + SanteDB.display.renderEntityName(result.name.OfficialRecord || result.name.$other);
                                if (result.address)
                                    retVal += " - <small>(<i class='fa fa-map-marker'></i> " + SanteDB.display.renderEntityAddress(result.address) + ")</small>";
                                return retVal;
                            }
                            else if (result.classConcept == EntityClassKeys.ServiceDeliveryLocation && result.name != null && result.typeConceptModel != null && result.typeConceptModel.name != null) {
                                retVal = "<div class='badge badge-info'>" +
                                    SanteDB.display.renderConcept(result.typeConceptModel) + "</div> " + SanteDB.display.renderEntityName(result.name.OfficialRecord || result.name.Assigned || result.name.$other );
                                if (result.relationship && result.relationship.Parent && result.relationship.Parent.targetModel && result.relationship.Parent.targetModel.name)
                                    retVal += " - <small>(<i class='fa fa-share-alt'></i> " + SanteDB.display.renderEntityName(result.relationship.Parent.targetModel.name.OfficialRecord || result.relationship.Parent.targetModel.name.Assigned) + ")</small>";
                                if (result.address)
                                    retVal += " - <small>(<i class='fa fa-map-marker'></i> " + SanteDB.display.renderEntityAddress(result.address) + ")</small>";
                                return retVal;
                            }
                            else if (result.name != null && result.typeConceptModel != null && result.typeConceptModel.name != null && result.name.Assigned) {
                                var retVal = "<div class='badge badge-default'>" +
                                    SanteDB.display.renderConcept(result.typeConceptModel) + "</div> " + SanteDB.display.renderEntityName(result.name.Assigned || result.name.$other);

                                if (result.address)
                                    retVal += " - <small>(<i class='fa fa-map-marker'></i> " + SanteDB.display.renderEntityAddress(result.address) + ")</small>";
                                return retVal;
                            }
                            else if (result.name != null && result.name.OfficialRecord)
                                return "<div class='badge badge-default'>" +
                                    result.$type + "</div> " + SanteDB.display.renderEntityName(result.name.OfficialRecord);
                            else if (result.name != null && result.name.Assigned)
                                return "<div class='badge badge-default'>" +
                                    result.$type + "</div> " + SanteDB.display.renderEntityName(result.name.Assigned)
                            else if (result.name != null && result.name.$other)
                                return "<div class='badge badge-default'>" +
                                    result.$type + "</div> " + SanteDB.display.renderEntityName(result.name.$other)
                            else
                                return result.text;
                        }
                    });

                    // HACK: For angular values, after select2 has "selected" the value, it will be a ? string: ID ? value we do not want this
                    // we want the actual value, so this little thing corrects this bugginess
                    $(element).on("select2:select", function (e) {
                        if (e.currentTarget.value.indexOf("? string:") == 0) {
                            e.currentTarget.value = e.currentTarget.value.substring(9, e.currentTarget.value.length - 2);
                        }
                        e.currentTarget.options.selectedIndex = e.currentTarget.options.length - 1;
                    });
                });
            }
        };
    })