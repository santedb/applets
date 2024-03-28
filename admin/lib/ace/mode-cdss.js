
ace.define("ace/mode/cdss_highlight_rules", ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"], function (require, exports, module) {
    /*
     * based on
     * " Vim ABAP syntax file
     * "    Language: SAP - ABAP/R4
     * "    Revision: 2.1
     * "  Maintainer: Marius Piedallu van Wyk <lailoken@gmail.com>
     * " Last Change: 2012 Oct 23
     */

    "use strict";

    var oop = require("../lib/oop");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var CdssHilightRules = function () {

        var keywordMapper = this.createKeywordMapper({
            "variable.language": "this",
            "keyword.control": "define include as end having repeat when then with propose apply assign where from select order by raise",
            "keyword.other": "fact data logic rule protocol library model metadata type",
            "constant.language": "true false iterations until for",
            "storage.type": "Patient Act SubstanceAdministration Procedure QuantityObservation CodedObservation TextObservation PatientEncounter Narrative",
            "storage.modifier": "negation track-by normalize computed scoped-to",
            "support.function": "hdsi csharp all none any query first last average ",
            "support.constant": "active dont-use trial-use retired json xml error danger warn info context proposal",
            "suppoort.variable": "uuid id status format type scope oid const priority",
            "support.type": "string bool int real long",

        }, "text", true, " ");

        this.$rules = {
            "start": [
                { token: "string", regex: /\"(?:.|\"\")*\"/ },
                { token: "markup.raw", regex: /\$\$/, next: "markup.raw" },
                { token: "string", regex: /\{.*?\}/ },
                { token: "string", regex: /\<.*?\>/ },
                { token: "doc.comment", regex: /(doc|version|author).*$/ },
                { token: "doc.comment", regex: /\/\/.+$/ },
                { token: "comment", regex: /\/\/.+$/ },
                { token: "paren.lparen", regex: "[\\[({]" },
                { token: "paren.rparen", regex: "[\\])}]" },
                { token: "constant.numeric", regex: "[+-]?\\d+\\b" },
                { token: "keyword.control", regex: /(track\-by|for|to)\s/, next: "parameter" },
                { token: "variable.parameter", regex: /\w+-\w[\-\w]*/ },
                { token: keywordMapper, regex: "\\b\\w+\\b" },
                { caseInsensitive: true }
            ],
            "parameter": [
                { token: "variable.parameter", regex: /\w(\w|\d|\[|\])*/, next: "start" }
            ],
            "markup.raw": [
                { token: "constant.language.escape", regex: /\\\$\\\$/ },
                { token: "markup.raw", regex: /\$\$/, next: "start" },
                { defaultToken: "markup.raw" }
            ]
        };
    };
    oop.inherits(CdssHilightRules, TextHighlightRules);

    exports.CdssHilightRules = CdssHilightRules;

});


ace.define("ace/mode/cdss", ["require", "exports", "module", "ace/mode/cdss_highlight_rules", "ace/range", "ace/mode/text", "ace/lib/oop"], function (require, exports, module) {
    "use strict";
    var Rules = require("./cdss_highlight_rules").CdssHilightRules;
    var Range = require("../range").Range;
    var TextMode = require("./text").Mode;

    var oop = require("../lib/oop");
    function Mode() {
        this.HighlightRules = Rules;
    }
    oop.inherits(Mode, TextMode);
    (function () {
        this.lineCommentStart = '"';
        this.getNextLineIndent = function (state, line, tab) {
            var indent = this.$getIndent(line);
            return indent;
        };
        this.$id = "ace/mode/cdss";
    }).call(Mode.prototype);
    exports.Mode = Mode;

}); (function () {
    ace.require(["ace/mode/cdss"], function (m) {
        if (typeof module == "object" && typeof exports == "object" && module) {
            module.exports = m;
        }
    });
})();