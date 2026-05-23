/*
    This file is part of matlab - formatter - vscode
    Copyright(C) 2019 - 2023 Benjamin "Mogli" Mann

    This program is free software: you can redistribute it and / or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version.

    This program is distributed in the hope that it will be useful,
        but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.See the
    GNU General Public License for more details.

        You should have received a copy of the GNU General Public License
    along with this program.If not, see < http: //www.gnu.org/licenses/>.
*/

'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const languageConfiguration = require("./language-configuration.json");
const { formatText } = require("./formatter/matlab_formatter");
const fullRange = doc => doc.validateRange(new vscode.Range(0, 0, Number.MAX_VALUE, Number.MAX_VALUE));
const fullLineRange = (doc, range) => {
    const start = new vscode.Position(range.start.line, 0);
    const end = doc.lineAt(range.end.line).range.end;
    return doc.validateRange(new vscode.Range(start, end));
};
const SUPPORTED_LANGUAGES = ["matlab", "octave"];
const CONFIG_SECTION = 'matlab-formatter-plus';

class MatlabFormatter {
    formatDocument(document, range) {
        return new Promise((resolve, reject) => {
            this.format(document, range).then((res) => {
                return resolve(res);
            });

        });
    }

    format(document, range) {
        return new Promise((resolve, reject) => {
            try {
                const config = vscode.workspace.getConfiguration(CONFIG_SECTION);
                const formatted = formatText(document.getText(), {
                    indentWidth: config.get('indentwidth'),
                    separateBlocks: config.get('separateBlocks'),
                    indentMode: config.get('indentMode'),
                    addSpaces: config.get('addSpaces'),
                    matrixIndent: config.get('matrixIndent'),
                    insertBlankLineBeforeBlocks: config.get('insertBlankLineBeforeBlocks'),
                    insertBlankLineAfterBlocks: config.get('insertBlankLineAfterBlocks'),
                    allowBlankLineBetweenConsecutiveBlockStarts: config.get('allowBlankLineBetweenConsecutiveBlockStarts'),
                    allowBlankLineBetweenConsecutiveBlockEnds: config.get('allowBlankLineBetweenConsecutiveBlockEnds'),
                    squeezeBlankAfterControlBlocks: config.get('squeezeBlankAfterControlBlocks'),
                    squeezeBlankAfterFunctionBlocks: config.get('squeezeBlankAfterFunctionBlocks'),
                    autoAppendSemicolon: config.get('autoAppendSemicolon'),
                    removeUnnecessarySemicolons: config.get('removeUnnecessarySemicolons'),
                    forceSplitStatements: config.get('forceSplitStatements'),
                    startLine: range.start.line + 1,
                    endLine: range.end.line + 1,
                });
                let toreplace = fullLineRange(document, range);
                var edit = [vscode.TextEdit.replace(toreplace, formatted)];
                return resolve(edit);
            } catch (error) {
                const message = error && error.message ? error.message : String(error);
                vscode.window.showErrorMessage('formatting failed:\n' + message);
                return resolve(null);
            }
        });
    }
}

exports.MatlabFormatter = MatlabFormatter;

class MatlabDocumentRangeFormatter {
    constructor() {
        this.formatter = new MatlabFormatter();
    }
    provideDocumentFormattingEdits(document, options, token) {
        return this.formatter.formatDocument(document, fullRange(document));
    }
    provideDocumentRangeFormattingEdits(document, range, options, token) {
        return this.formatter.formatDocument(document, range);
    }
}

function activate(context) {
    const formatter = new MatlabDocumentRangeFormatter();
    for (const language of SUPPORTED_LANGUAGES) {
        context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider({ language }, formatter));
        context.subscriptions.push(vscode.languages.registerDocumentRangeFormattingEditProvider({ language }, formatter));
        context.subscriptions.push(vscode.languages.setLanguageConfiguration(language, languageConfiguration));
    }
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
