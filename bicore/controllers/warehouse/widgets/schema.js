/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../../../js/santedb-bi.js"/>
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
angular.module('santedb').controller('DataMartSchemaController', ["$scope", function ($scope) {

    $scope.currentZoom = 100;
    $scope.zoom = function(factor) {
        $scope.currentZoom += factor;
        $("svg#entityRelationshipDiagram").css("width", `${$scope.currentZoom}%`);

    }

    function renderRelationships(table, schema) {
        var retVal = "";
        table.columns.filter(column=>column.type == "Ref").forEach(column => {
            retVal += `\t${column.otherTable.$ref} |${column.notNull ? '|' : 'o' }--o{ ${table.name} : ${column.name} \r\n`;
        });

        if(table.parent) {
            var parentTable = schema.find(o=>o.name == table.parent.$ref);
            var keyTable = parentTable;
            while(keyTable.parent) {
                keyTable = schema.find(o=>o.name == keyTable.parent.$ref);
            }
            retVal += `\t${parentTable.name} ||--|| ${table.name} : ${keyTable.columns.find(c=>c.key).name} \r\n`;
        }
        return retVal;
    }

    function renderTableSchema(table, schema) {
        var retVal = `\t${table.name} {\r\n`;
        table.columns.forEach(column => {
            var atts = [], desc = [];
            if(column.key) {
                atts.push('PK');
            }
            if(column.unique) {
                atts.push('UK');
            }
            if(column.index) {
                desc.push('INDEXED');
            }
            if(column.notNull) {
                desc.push('NOT NULL');
            }
            if(column.otherTable) {
                atts.push('FK');
            }

            if(column.type == "Ref") {
                var otherTable = schema.find(o=>o.name == column.otherTable.$ref);
                var keyTable = otherTable;
                while(keyTable.parent) {
                    keyTable = schema.find(o=>o.name == keyTable.parent.$ref);
                }
                column.type = keyTable.columns.find(o=>o.key).type;
                desc.push(`Reference to ${otherTable.name}`);
            }
            retVal += `\t\t${column.type} ${column.name} ${atts.join(',')} "${desc.join(',')}"\r\n`;
        })

        if(table.parent) {
            var parentTable = schema.find(o=>o.name == table.parent.$ref);
            while(parentTable.parent) {
                parentTable = schema.find(o=>o.name == parentTable.parent.$ref);
            }
            var keyColumn = parentTable.columns.find(c=>c.key);
            retVal += `\t\t${keyColumn.type} ${keyColumn.name} PK,FK "Parent Table Link to ${table.parent.$ref}" \r\n`;
        }

        retVal += "\t}\r\n";
        return retVal;
    }
    $scope.$watch("scopedObject", function(o, n) {

        if(n) {
            var graphDefinition = "erDiagram\r\n";
            n.schemas.forEach(table => graphDefinition += renderRelationships(table, n.schemas));
            n.schemas.forEach(table => graphDefinition += renderTableSchema(table, n.schemas));
            mermaid.mermaidAPI.render('entityRelationshipDiagram', graphDefinition, (svg) => {
                svg = svg.replace(/max-width: .*?px/, "max-width: none !important");
                $('#renderSvgEntityRelationshipDiagram').html(svg);
            });

        }
    });

}]);
