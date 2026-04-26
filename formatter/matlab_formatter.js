"use strict";

const fs = require("fs");

class Formatter {
    static cellIndentPatterns = new Map([
        ["[", /(\s*)((\S.*)?)(\[.*$)/],
        ["{", /(\s*)((\S.*)?)(\{.*$)/],
    ]);

    constructor(indentWidth, separateBlocks, indentMode, operatorSep, matrixIndent) {
        this.ilvl = 0;
        this.istep = [];
        this.fstep = [];
        this.iwidth = indentWidth;
        this.matrix = 0;
        this.cell = 0;
        this.isblockcomment = 0;
        this.islinecomment = 0;
        this.longline = 0;
        this.continueline = 0;
        this.iscomment = 0;
        this.separateBlocks = separateBlocks;
        this.ignoreLines = 0;
        this.indentMode = indentMode;
        this.operatorSep = operatorSep;
        this.matrixIndent = matrixIndent;
        this.insertBlankLineBeforeBlocks = true;
        this.insertBlankLineAfterBlocks = true;
        this.allowBlankLineBetweenConsecutiveBlockStarts = false;
        this.allowBlankLineBetweenConsecutiveBlockEnds = false;
        this.squeezeBlankAfterControlBlocks = false;
        this.squeezeBlankAfterFunctionBlocks = false;
        this.autoAppendSemicolon = false;
        this.removeUnnecessarySemicolons = false;
        this.currentBlockStartType = null;
    }

    static ctrl1line = /^(\s*)(if|while|for|try)(\W\s*\S.*\W)((end|endif|endwhile|endfor);?)(\s+\S.*|\s*$)/;
    static fcnstart = /^(\s*)(function|classdef)\s*(\W\s*\S.*|\s*$)/;
    static ctrlstart = /^(\s*)(if|while|for|parfor|try|spmd)\b\s*(\W\s*\S.*|\s*$)/;
    static ctrlstartDecl = /^(\s*)(methods|properties|events|arguments|enumeration)\b(\s*(\([^%]*\))?\s*(%.*)?\s*$)/;
    static ctrlIgnore = /^(\s*)(import|clear|clearvars)(.*$)/;
    static ctrlstart2 = /^(\s*)(switch)\s*(\W\s*\S.*|\s*$)/;
    static ctrlcont = /^(\s*)(elseif|else|case|otherwise|catch)\s*(\W\s*\S.*|\s*$)/;
    static ctrlend = /^(\s*)((end|endfunction|endif|endwhile|endfor|endswitch);?)(\s+\S.*|\s*$)/;
    static linecomment = /^(\s*)%.*$/;
    static ellipsis = /^.*\.\.\..*$/;
    static blockcommentOpen = /^(\s*)%\{\s*$/;
    static blockcommentClose = /^(\s*)%\}\s*$/;
    static blockClose = /^\s*[\)\]\}].*$/;
    static ignoreCommand = /^.*formatter\s+ignore\s+(\d*).*$/;

    static pString = /^(.*?[\(\[\{,;=\+\-\*\/\|\&\s]|^)\s*(\'([^\']|\'\')+\')([\)\}\]\+\-\*\/=\|\&,;].*|\s+.*|$)/;
    static pStringDq = /^(.*?[\(\[\{,;=\+\-\*\/\|\&\s]|^)\s*(\"([^\"])*\")([\)\}\]\+\-\*\/=\|\&,;].*|\s+.*|$)/;
    static pComment = /^(.*\S|^)\s*(%.*)/;
    static pBlank = /^\s+$/;
    static pNumSc = /^(.*?\W|^)\s*(\d+\.?\d*)([eE][+-]?)(\d+)(.*)/;
    static pNumR = /^(.*?\W|^)\s*(\d+)\s*(\/)\s*(\d+)(.*)/;
    static pIncr = /^(.*?\S|^)\s*(\+|\-)\s*(\+|\-)\s*([\)\]\},;].*|$)/;
    static pSign = /^(.*?[\(\[\{,;:=\*\/\s]|^)\s*(\+|\-)(\w.*)/;
    static pColon = /^(.*?\S|^)\s*(:)\s*(\S.*|$)/;
    static pEllipsis = /^(.*?\S|^)\s*(\.\.\.)\s*(\S.*|$)/;
    static pOpDot = /^(.*?\S|^)\s*(\.)\s*(\+|\-|\*|\/|\^)\s*(=)\s*(\S.*|$)/;
    static pPowDot = /^(.*?\S|^)\s*(\.)\s*(\^)\s*(\S.*|$)/;
    static pPow = /^(.*?\S|^)\s*(\^)\s*(\S.*|$)/;
    static pOpComb = /^(.*?\S|^)\s*(\.|\+|\-|\*|\\|\/|=|<|>|\||\&|!|~|\^)\s*(<|>|=|\+|\-|\*|\/|\&|\|)\s*(\S.*|$)/;
    static pNot = /^(.*?\S|^)\s*(!|~)\s*(\S.*|$)/;
    static pOp = /^(.*?\S|^)\s*(\+|\-|\*|\\|\/|=|!|~|<|>|\||\&)\s*(\S.*|$)/;
    static pFunc = /^(.*?\w)(\()\s*(\S.*|$)/;
    static pOpen = /^(.*?)(\(|\[|\{)\s*(\S.*|$)/;
    static pClose = /^(.*?\S|^)\s*(\)|\]|\})(.*|$)/;
    static pComma = /^(.*?\S|^)\s*(,|;)\s*(\S.*|$)/;
    static pMultiws = /^(.*?\S|^)(\s{2,})(\S.*|$)/;

    static escapeRegex(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    static getLeadingKeyword(line) {
        let start = 0;
        while (start < line.length && /\s/.test(line[start])) {
            start += 1;
        }
        let end = start;
        while (end < line.length && /[A-Za-z_]/.test(line[end])) {
            end += 1;
        }
        return line.slice(start, end);
    }

    cellIndent(line, cellOpen, cellClose, indent) {
        const pattern = Formatter.cellIndentPatterns.get(cellOpen)
            || new RegExp(`(\\s*)((\\S.*)?)(${Formatter.escapeRegex(cellOpen)}.*$)`);
        line = this.cleanLineFromStringsAndComments(line);
        const opened = countOccurrences(line, cellOpen) - countOccurrences(line, cellClose);
        if (opened > 0) {
            const match = line.match(pattern);
            const n = match && match[2] ? match[2].length : 0;
            indent = this.matrixIndent ? (n + 1) : this.iwidth;
        } else if (opened < 0) {
            indent = 0;
        }
        return [opened, indent];
    }

    multilinematrix(line) {
        const [tmp, indent] = this.cellIndent(line, "[", "]", this.matrix);
        this.matrix = indent;
        return tmp;
    }

    cellarray(line) {
        const [tmp, indent] = this.cellIndent(line, "{", "}", this.cell);
        this.cell = indent;
        return tmp;
    }

    cleanLineFromStringsAndComments(line) {
        const split = this.extractStringComment(line);
        if (split) {
            return this.cleanLineFromStringsAndComments(split[0]) + " " + this.cleanLineFromStringsAndComments(split[2]);
        }
        return line;
    }

    extractStringComment(part) {
        let match = part.match(Formatter.pString);
        const match2 = part.match(Formatter.pStringDq);
        if (match2 && (!match || match[2].length < match2[2].length)) {
            match = match2;
        }
        if (match) {
            return [match[1], match[2], match[4]];
        }

        match = part.match(Formatter.pComment);
        if (match) {
            this.iscomment = 1;
            return [match[1] + " ", match[2], ""];
        }

        return null;
    }

    extract(part) {
        let match = part.match(Formatter.pBlank);
        if (match) {
            return ["", " ", ""];
        }

        const stringOrComment = this.extractStringComment(part);
        if (stringOrComment) {
            return stringOrComment;
        }

        match = part.match(Formatter.pNumSc);
        if (match) {
            return [match[1] + match[2], match[3], match[4] + match[5]];
        }

        match = part.match(Formatter.pNumR);
        if (match) {
            return [match[1] + match[2], match[3], match[4] + match[5]];
        }

        match = part.match(Formatter.pIncr);
        if (match) {
            return [match[1], match[2] + match[3], match[4]];
        }

        match = part.match(Formatter.pSign);
        if (match) {
            return [match[1], match[2], match[3]];
        }

        match = part.match(Formatter.pColon);
        if (match) {
            return [match[1], match[2], match[3]];
        }

        match = part.match(Formatter.pOpDot);
        if (match) {
            const sep = this.operatorSep > 0 ? " " : "";
            return [match[1] + sep, match[2] + match[3] + match[4], sep + match[5]];
        }

        match = part.match(Formatter.pPowDot);
        if (match) {
            const sep = this.operatorSep > 0.5 ? " " : "";
            return [match[1] + sep, match[2] + match[3], sep + match[4]];
        }

        match = part.match(Formatter.pPow);
        if (match) {
            const sep = this.operatorSep > 0.5 ? " " : "";
            return [match[1] + sep, match[2], sep + match[3]];
        }

        match = part.match(Formatter.pOpComb);
        if (match) {
            const sep = this.operatorSep > 0 ? " " : "";
            return [match[1] + sep, match[2] + match[3], sep + match[4]];
        }

        match = part.match(Formatter.pNot);
        if (match) {
            return [match[1] + " ", match[2], match[3]];
        }

        match = part.match(Formatter.pOp);
        if (match) {
            const sep = this.operatorSep > 0 ? " " : "";
            return [match[1] + sep, match[2], sep + match[3]];
        }

        match = part.match(Formatter.pFunc);
        if (match) {
            return [match[1], match[2], match[3]];
        }

        match = part.match(Formatter.pOpen);
        if (match) {
            return [match[1], match[2], match[3]];
        }

        match = part.match(Formatter.pClose);
        if (match) {
            return [match[1], match[2], match[3]];
        }

        match = part.match(Formatter.pComma);
        if (match) {
            return [match[1], match[2], " " + match[3]];
        }

        match = part.match(Formatter.pEllipsis);
        if (match) {
            return [match[1] + " ", match[2], " " + match[3]];
        }

        match = part.match(Formatter.pMultiws);
        if (match) {
            return [match[1], " ", match[3]];
        }

        return null;
    }

    formatPart(part) {
        const match = this.extract(part);
        if (match) {
            return this.formatPart(match[0]) + match[1] + this.formatPart(match[2]);
        }
        return part;
    }

    appendSemicolonIfNeeded(line) {
        if (!this.autoAppendSemicolon) {
            return line;
        }

        const trimmed = line.trim();
        if (!trimmed || trimmed === "...") {
            return line;
        }

        const cleaned = this.cleanLineFromStringsAndComments(line);
        const codeOnly = cleaned.trimEnd();
        if (!codeOnly || codeOnly.endsWith(";") || codeOnly.endsWith("...")) {
            return line;
        }

        const commentIndex = this.findCommentIndex(line);
        if (commentIndex === -1) {
            return `${line};`;
        }

        const beforeComment = line.slice(0, commentIndex).replace(/\s+$/, "");
        const comment = line.slice(commentIndex);
        if (!beforeComment) {
            return line;
        }
        return `${beforeComment}; ${comment.trimStart()}`;
    }

    findCommentIndex(line) {
        let inSingleQuote = false;
        let inDoubleQuote = false;
        for (let idx = 0; idx < line.length; idx += 1) {
            const ch = line[idx];
            const next = line[idx + 1];

            if (!inDoubleQuote && ch === "'") {
                if (inSingleQuote && next === "'") {
                    idx += 1;
                    continue;
                }
                inSingleQuote = !inSingleQuote;
                continue;
            }

            if (!inSingleQuote && ch === "\"") {
                inDoubleQuote = !inDoubleQuote;
                continue;
            }

            if (!inSingleQuote && !inDoubleQuote && ch === "%") {
                return idx;
            }
        }
        return -1;
    }

    formatStatementLine(line) {
        return this.appendSemicolonIfNeeded(this.indent() + this.formatPart(line).trim());
    }

    removeTrailingSemicolonIfNeeded(line) {
        if (!this.removeUnnecessarySemicolons) {
            return line;
        }

        const commentIndex = this.findCommentIndex(line);
        if (commentIndex === -1) {
            return line.replace(/;\s*$/, "");
        }

        const beforeComment = line.slice(0, commentIndex).replace(/\s+$/, "");
        const comment = line.slice(commentIndex).trimStart();
        if (!beforeComment.endsWith(";")) {
            return line;
        }
        return `${beforeComment.slice(0, -1)} ${comment}`.replace(/\s+$/, "");
    }

    formatStructuralLine(line) {
        return this.removeTrailingSemicolonIfNeeded(line);
    }

    indent(addspaces = 0) {
        return " ".repeat(Math.max(0, (this.ilvl + this.continueline) * this.iwidth + addspaces));
    }

    classifyBlockStart(line) {
        switch (Formatter.getLeadingKeyword(line)) {
        case "if":
        case "while":
        case "for":
        case "try":
            if (Formatter.ctrl1line.test(line)) {
                return null;
            }
            return Formatter.ctrlstart.test(line) ? "control" : null;
        case "parfor":
        case "spmd":
            return Formatter.ctrlstart.test(line) ? "control" : null;
        case "methods":
        case "properties":
        case "events":
        case "arguments":
        case "enumeration":
            return Formatter.ctrlstartDecl.test(line) ? "control" : null;
        case "switch":
            return Formatter.ctrlstart2.test(line) ? "control" : null;
        case "function":
        case "classdef":
            return Formatter.fcnstart.test(line) ? "function" : null;
        default:
            return null;
        }
    }

    classifyBlockContinuation(line) {
        switch (Formatter.getLeadingKeyword(line)) {
        case "elseif":
        case "else":
        case "case":
        case "otherwise":
        case "catch":
            if (Formatter.ctrlcont.test(line)) {
                return "control";
            }
            break;
        default:
            break;
        }
        return null;
    }

    isBlockEnd(line) {
        switch (Formatter.getLeadingKeyword(line)) {
        case "end":
        case "endfunction":
        case "endif":
        case "endwhile":
        case "endfor":
        case "endswitch":
            return Formatter.ctrlend.test(line);
        default:
            return false;
        }
    }

    formatLine(line) {
        this.currentBlockStartType = null;

        if (this.ignoreLines > 0) {
            this.ignoreLines -= 1;
            return [0, this.indent() + line.trim()];
        }

        let leadingKeyword = Formatter.getLeadingKeyword(line);
        if (this.removeUnnecessarySemicolons && [
            "function", "classdef", "if", "while", "for", "parfor", "try", "spmd",
            "switch", "methods", "properties", "events", "arguments", "enumeration",
            "elseif", "else", "case", "otherwise", "catch",
            "end", "endfunction", "endif", "endwhile", "endfor", "endswitch",
        ].includes(leadingKeyword)) {
            line = this.removeTrailingSemicolonIfNeeded(line);
            leadingKeyword = Formatter.getLeadingKeyword(line);
        }

        if (line.trimStart().startsWith("%")) {
            this.islinecomment = 2;
        } else {
            this.islinecomment = Math.max(0, this.islinecomment - 1);
        }

        if (/^\s*%\{\s*$/.test(line)) {
            this.isblockcomment = Number.POSITIVE_INFINITY;
        } else if (/^\s*%\}\s*$/.test(line)) {
            this.isblockcomment = 1;
        } else {
            this.isblockcomment = Math.max(0, this.isblockcomment - 1);
        }

        this.iscomment = 0;
        const strippedline = this.cleanLineFromStringsAndComments(line);
        const ellipsisInComment = this.islinecomment === 2 || this.isblockcomment;
        if (Formatter.blockClose.test(strippedline) || ellipsisInComment) {
            this.continueline = 0;
        } else {
            this.continueline = this.longline;
        }
        if (Formatter.ellipsis.test(strippedline) && !ellipsisInComment) {
            this.longline = 1;
        } else {
            this.longline = 0;
        }

        if (this.isblockcomment) {
            return [0, line.replace(/\r?\n$/, "")];
        }
        if (this.islinecomment === 2) {
            const match = line.match(Formatter.ignoreCommand);
            if (match) {
                if (match[1] && Number.parseInt(match[1], 10) > 1) {
                    this.ignoreLines = Number.parseInt(match[1], 10);
                } else {
                    this.ignoreLines = 1;
                }
            }
            return [0, this.indent() + line.trim()];
        }

        let match = null;

        if (leadingKeyword === "import" || leadingKeyword === "clear" || leadingKeyword === "clearvars") {
            match = line.match(Formatter.ctrlIgnore);
            if (match) {
                const formatted = this.indent() + line.trim();
                return [0, leadingKeyword === "import" ? formatted : this.appendSemicolonIfNeeded(formatted)];
            }
        }

        switch (leadingKeyword) {
        case "if":
        case "while":
        case "for":
        case "try":
            match = line.match(Formatter.ctrl1line);
            if (match) {
                return [
                    0,
                    this.formatStructuralLine(this.indent()
                    + match[2]
                    + " "
                    + this.formatPart(match[3]).trim()
                    + " "
                    + match[4]
                    + " "
                    + this.formatPart(match[6]).trim()),
                ];
            }
            break;
        default:
            break;
        }

        switch (leadingKeyword) {
        case "function":
        case "classdef":
            match = line.match(Formatter.fcnstart);
            if (match) {
                let offset = this.indentMode;
                this.fstep.push(1);
                if (this.indentMode === -1) {
                    offset = Number(this.fstep.length > 1);
                }
                this.currentBlockStartType = "function";
                return [offset, this.formatStructuralLine(this.indent() + match[2] + " " + this.formatPart(match[3]).trim())];
            }
            break;
        case "if":
        case "while":
        case "for":
        case "parfor":
        case "try":
        case "spmd":
            match = line.match(Formatter.ctrlstart);
            if (match) {
                this.istep.push(1);
                this.currentBlockStartType = "control";
                return [1, this.formatStructuralLine(this.indent() + match[2] + " " + this.formatPart(match[3]).trim())];
            }
            break;
        case "methods":
        case "properties":
        case "events":
        case "arguments":
        case "enumeration":
            match = line.match(Formatter.ctrlstartDecl);
            if (match) {
                this.istep.push(1);
                this.currentBlockStartType = "control";
                return [1, this.formatStructuralLine(this.indent() + match[2] + this.formatPart(match[3]).replace(/\s+$/, ""))];
            }
            break;
        case "switch":
            match = line.match(Formatter.ctrlstart2);
            if (match) {
                this.istep.push(2);
                this.currentBlockStartType = "control";
                return [2, this.formatStructuralLine(this.indent() + match[2] + " " + this.formatPart(match[3]).trim())];
            }
            break;
        case "elseif":
        case "else":
        case "case":
        case "otherwise":
        case "catch":
            match = line.match(Formatter.ctrlcont);
            if (match) {
                return [0, this.formatStructuralLine(this.indent(-this.iwidth) + match[2] + " " + this.formatPart(match[3]).trim())];
            }
            break;
        case "end":
        case "endfunction":
        case "endif":
        case "endwhile":
        case "endfor":
        case "endswitch":
            match = line.match(Formatter.ctrlend);
            if (match) {
                let step;
                if (this.istep.length > 0) {
                    step = this.istep.pop();
                } else if (this.fstep.length > 0) {
                    step = this.fstep.pop();
                } else {
                    step = 0;
                }
                return [
                    -step,
                    this.formatStructuralLine(this.indent(-step * this.iwidth) + match[2] + " " + this.formatPart(match[4]).trim()),
                ];
            }
            break;
        default:
            break;
        }

        const tmpMatrix = this.matrix;
        if (tmpMatrix || line.includes("[") || line.includes("]")) {
            const matrixDelta = this.multilinematrix(line);
            if (matrixDelta || tmpMatrix) {
                const formatted = this.indent(tmpMatrix) + this.formatPart(line).trim();
                const matrixStillOpen = this.matrix > 0;
                return [0, matrixStillOpen ? formatted : this.appendSemicolonIfNeeded(formatted)];
            }
        }

        const tmpCell = this.cell;
        if (tmpCell || line.includes("{") || line.includes("}")) {
            const cellDelta = this.cellarray(line);
            if (cellDelta || tmpCell) {
                const formatted = this.indent(tmpCell) + this.formatPart(line).trim();
                const cellStillOpen = this.cell > 0;
                return [0, cellStillOpen ? formatted : this.appendSemicolonIfNeeded(formatted)];
            }
        }

        return [0, this.formatStatementLine(line)];
    }
    getLineInfo(line) {
        return {
            isBlank: /^\s*$/.test(line),
            blockStartType: this.classifyBlockStart(line),
            blockContinuationType: this.classifyBlockContinuation(line),
            isBlockEnd: this.isBlockEnd(line),
        };
    }

    formatText(text, start, end) {
        const allLines = splitLines(text);
        const normalizedEnd = end == null ? allLines.length : end;
        let rlines = allLines.slice(start - 1, normalizedEnd);
        const wlines = [];
        let lineInfos = [];
        let nextNonBlankInfos = [];

        if (rlines.length === 0) {
            rlines = [""];
        }

        lineInfos = rlines.map((line) => this.getLineInfo(line));
        nextNonBlankInfos = new Array(rlines.length).fill(null);
        let nextNonBlankInfo = null;
        for (let idx = rlines.length - 1; idx >= 0; idx -= 1) {
            nextNonBlankInfos[idx] = nextNonBlankInfo;
            if (!lineInfos[idx].isBlank) {
                nextNonBlankInfo = lineInfos[idx];
            }
        }

        for (const line of allLines.slice(0, start - 1)) {
            if (/^\s*$/.test(line)) {
                continue;
            }
            const [offset] = this.formatLine(line);
            this.ilvl = Math.max(0, this.ilvl + offset);
        }

        let blank = true;
        let previousBlockStartType = null;
        let previousBlockContinuationType = null;
        let previousLineStartedBlock = false;
        let previousLineContinuedBlock = false;
        let previousLineEndedBlock = false;

        for (let idx = 0; idx < rlines.length; idx += 1) {
            const line = rlines[idx];
            const lineInfo = lineInfos[idx];
            const nextInfo = nextNonBlankInfos[idx];
            const nextBlockStartType = nextInfo ? nextInfo.blockStartType : null;
            const nextBlockContinuationType = nextInfo ? nextInfo.blockContinuationType : null;
            const nextLineIsBlockEnd = nextInfo ? nextInfo.isBlockEnd : false;

            if (lineInfo.isBlank) {
                if (nextBlockContinuationType !== null) {
                    continue;
                }
                if (
                    previousLineStartedBlock
                    && nextBlockStartType !== null
                    && !this.allowBlankLineBetweenConsecutiveBlockStarts
                ) {
                    continue;
                }
                if (
                    previousLineEndedBlock
                    && nextLineIsBlockEnd
                    && !this.allowBlankLineBetweenConsecutiveBlockEnds
                ) {
                    continue;
                }
                if (
                    (previousBlockStartType === "control" && this.squeezeBlankAfterControlBlocks)
                    || (previousBlockContinuationType === "control" && this.squeezeBlankAfterControlBlocks)
                    || (previousBlockStartType === "function" && this.squeezeBlankAfterFunctionBlocks)
                ) {
                    continue;
                }
                if (!blank) {
                    blank = true;
                    wlines.push("");
                }
                continue;
            }

            const [offset, formattedLine] = this.formatLine(line);
            const currentBlockContinuationType = lineInfo.blockContinuationType;
            this.ilvl = Math.max(0, this.ilvl + offset);

            if (
                this.separateBlocks
                && this.insertBlankLineBeforeBlocks
                && offset > 0
                && !blank
                && !this.islinecomment
                && !previousLineContinuedBlock
                && (this.allowBlankLineBetweenConsecutiveBlockStarts || !previousLineStartedBlock)
            ) {
                wlines.push("");
            }

            wlines.push(formattedLine.replace(/\s+$/, ""));

            if (
                this.separateBlocks
                && this.insertBlankLineAfterBlocks
                && offset < 0
                && nextBlockContinuationType === null
                && (this.allowBlankLineBetweenConsecutiveBlockEnds || !nextLineIsBlockEnd)
            ) {
                wlines.push("");
                blank = true;
            } else {
                blank = false;
            }
            previousBlockStartType = this.currentBlockStartType;
            previousBlockContinuationType = currentBlockContinuationType;
            previousLineStartedBlock = this.currentBlockStartType !== null;
            previousLineContinuedBlock = currentBlockContinuationType !== null;
            previousLineEndedBlock = offset < 0;
        }

        while (wlines.length > 0 && !wlines[wlines.length - 1]) {
            wlines.pop();
        }

        if (wlines.length === 0) {
            wlines.push("");
        }

        return wlines.join("\n");
    }
}

function countOccurrences(line, token) {
    if (!token) {
        return 0;
    }
    return line.split(token).length - 1;
}

function splitLines(text) {
    return text.replace(/\r\n/g, "\n").split("\n");
}

function normalizeOptions(options = {}) {
    return {
        startLine: Number.isInteger(options.startLine) ? options.startLine : 1,
        endLine: Number.isInteger(options.endLine) ? options.endLine : undefined,
        indentWidth: Number.isInteger(options.indentWidth) ? options.indentWidth : 4,
        separateBlocks: options.separateBlocks ?? true,
        indentMode: options.indentMode ?? "all_functions",
        addSpaces: options.addSpaces ?? "exclude_pow",
        matrixIndent: options.matrixIndent ?? "aligned",
        insertBlankLineBeforeBlocks: options.insertBlankLineBeforeBlocks ?? true,
        insertBlankLineAfterBlocks: options.insertBlankLineAfterBlocks ?? true,
        allowBlankLineBetweenConsecutiveBlockStarts: options.allowBlankLineBetweenConsecutiveBlockStarts ?? false,
        allowBlankLineBetweenConsecutiveBlockEnds: options.allowBlankLineBetweenConsecutiveBlockEnds ?? false,
        squeezeBlankAfterControlBlocks: options.squeezeBlankAfterControlBlocks ?? false,
        squeezeBlankAfterFunctionBlocks: options.squeezeBlankAfterFunctionBlocks ?? false,
        autoAppendSemicolon: options.autoAppendSemicolon ?? false,
        removeUnnecessarySemicolons: options.removeUnnecessarySemicolons ?? false,
    };
}

function createFormatter(options = {}) {
    const normalized = normalizeOptions(options);
    const indentModes = { all_functions: 1, only_nested_functions: -1, classic: 0 };
    const operatorSpaces = { all_operators: 1, exclude_pow: 0.5, no_spaces: 0 };
    const matrixIndentation = { aligned: 1, simple: 0 };

    const formatter = new Formatter(
        normalized.indentWidth,
        normalized.separateBlocks,
        indentModes[normalized.indentMode] ?? indentModes.all_functions,
        operatorSpaces[normalized.addSpaces] ?? operatorSpaces.exclude_pow,
        matrixIndentation[normalized.matrixIndent] ?? matrixIndentation.aligned
    );

    formatter.insertBlankLineBeforeBlocks = normalized.insertBlankLineBeforeBlocks;
    formatter.insertBlankLineAfterBlocks = normalized.insertBlankLineAfterBlocks;
    formatter.allowBlankLineBetweenConsecutiveBlockStarts = normalized.allowBlankLineBetweenConsecutiveBlockStarts;
    formatter.allowBlankLineBetweenConsecutiveBlockEnds = normalized.allowBlankLineBetweenConsecutiveBlockEnds;
    formatter.squeezeBlankAfterControlBlocks = normalized.squeezeBlankAfterControlBlocks;
    formatter.squeezeBlankAfterFunctionBlocks = normalized.squeezeBlankAfterFunctionBlocks;
    formatter.autoAppendSemicolon = normalized.autoAppendSemicolon;
    formatter.removeUnnecessarySemicolons = normalized.removeUnnecessarySemicolons;

    return { formatter, options: normalized };
}

function formatText(text, options = {}) {
    const { formatter, options: normalized } = createFormatter(options);
    return formatter.formatText(text, normalized.startLine, normalized.endLine);
}

function parseCliArgs(argv) {
    const options = {};
    for (const arg of argv) {
        const [rawKey, ...rest] = arg.split("=");
        const value = rest.join("=");
        if (!rawKey.startsWith("--")) {
            continue;
        }
        options[rawKey.replace(/^--/, "")] = coerceOptionValue(value);
    }
    return options;
}

function coerceOptionValue(value) {
    if (value === "true") {
        return true;
    }
    if (value === "false") {
        return false;
    }
    if (/^-?\d+$/.test(value)) {
        return Number.parseInt(value, 10);
    }
    return value;
}

function runCli(argv = process.argv.slice(2)) {
    const [filename, ...rest] = argv;
    if (!filename) {
        process.stderr.write("usage: matlab_formatter.js filename [options...]\n");
        process.exitCode = 1;
        return;
    }

    const options = normalizeOptions(parseCliArgs(rest));
    const input = filename === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(filename, "utf8");
    const output = formatText(input, options);
    process.stdout.write(output);
}

module.exports = {
    Formatter,
    formatText,
    normalizeOptions,
};

if (require.main === module) {
    runCli();
}
