"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { formatText } = require("./matlab_formatter");

function testDefaultFixtureFormats() {
    const input = fs.readFileSync(path.join(__dirname, "test.m"), "utf8");
    const output = formatText(input, { startLine: 1, endLine: 999999 });
    assert.ok(output.includes("function foo = myFun(a, b, c)"));
    assert.ok(output.includes("fprintf('Hello world \\n');"));
}

function testAutoAppendSemicolonForRegularStatements() {
    const input = [
        "a=1",
        "disp(a) % keep comment",
        "if a",
        "    b=2",
        "end",
    ].join("\n");
    const output = formatText(input, {
        startLine: 1,
        endLine: 999999,
        autoAppendSemicolon: true,
        separateBlocks: false,
    });

    assert.strictEqual(output, [
        "a = 1;",
        "disp(a); % keep comment",
        "if a",
        "    b = 2;",
        "end",
    ].join("\n"));
}

function testAutoAppendSemicolonSkipsContinuationAndExistingSemicolons() {
    const input = [
        "value = foo ...",
        "    + bar",
        "x = 1;",
    ].join("\n");
    const output = formatText(input, {
        startLine: 1,
        endLine: 999999,
        autoAppendSemicolon: true,
        separateBlocks: false,
    });

    assert.strictEqual(output, [
        "value = foo ...",
        "    + bar;",
        "x = 1;",
    ].join("\n"));
}

function testAutoAppendSemicolonPreservesStringsCommentsAndMatrices() {
    const input = [
        "msg = '100%' % keep percent",
        "M = [1 2",
        "     3 4]",
    ].join("\n");
    const output = formatText(input, {
        startLine: 1,
        endLine: 999999,
        autoAppendSemicolon: true,
        separateBlocks: false,
    });

    assert.strictEqual(output, [
        "msg = '100%'; % keep percent",
        "M = [1 2",
        "     3 4];",
    ].join("\n"));
}

function testAutoAppendSemicolonIgnoresMixedQuotedAndUnquotedCommentText() {
    const input = [
        "switchType='TV_Cavity'; % 'a' n",
        "switchType='TV_Cavity'; % 'a' 'n'",
    ].join("\n");
    const output = formatText(input, {
        startLine: 1,
        endLine: 999999,
        autoAppendSemicolon: true,
        separateBlocks: false,
    });

    assert.strictEqual(output, [
        "switchType = 'TV_Cavity'; % 'a' n",
        "switchType = 'TV_Cavity'; % 'a' 'n'",
    ].join("\n"));
}

function testAutoAppendSemicolonSkipsImportStatements() {
    const input = [
        "import matlab.lang.*",
        "clear foo",
    ].join("\n");
    const output = formatText(input, {
        startLine: 1,
        endLine: 999999,
        autoAppendSemicolon: true,
        separateBlocks: false,
    });

    assert.strictEqual(output, [
        "import matlab.lang.*",
        "clear foo;",
    ].join("\n"));
}

function testRemoveUnnecessarySemicolonsForStructuralLines() {
    const input = [
        "function y=foo(x);",
        "if x > 0;",
        "    y = x;",
        "else;",
        "    y = -x;",
        "end;",
        "end;",
    ].join("\n");
    const output = formatText(input, {
        startLine: 1,
        endLine: 999999,
        removeUnnecessarySemicolons: true,
        separateBlocks: false,
    });

    assert.strictEqual(output, [
        "function y = foo(x)",
        "    if x > 0",
        "        y = x;",
        "    else",
        "        y = -x;",
        "    end",
        "end",
    ].join("\n"));
}

function testRemoveUnnecessarySemicolonsPreservesStatementSemicolons() {
    const input = [
        "clear foo;",
        "x = 1;",
        "disp(x); % keep output suppression",
    ].join("\n");
    const output = formatText(input, {
        startLine: 1,
        endLine: 999999,
        removeUnnecessarySemicolons: true,
        separateBlocks: false,
    });

    assert.strictEqual(output, [
        "clear foo;",
        "x = 1;",
        "disp(x); % keep output suppression",
    ].join("\n"));
}

function testEndKeywordInsideIndexDoesNotTriggerInlineControlFlow() {
    const input = [
        "for i = 1:22",
        "",
        "    if i > 3 && i < a(end - 1)",
        "        break",
        "    else",
        "        continue",
        "    end",
        "",
        "end",
    ].join("\n");
    const output = formatText(input, {
        startLine: 1,
        endLine: 999999,
        autoAppendSemicolon: true,
        removeUnnecessarySemicolons: true,
        separateBlocks: false,
    });

    assert.strictEqual(output, [
        "for i = 1:22",
        "    if i > 3 && i < a(end - 1)",
        "        break;",
        "    else",
        "        continue;",
        "    end",
        "end",
    ].join("\n"));
}

function testForceSplitStatementsBreaksTopLevelStatementsIntoLines() {
    const input = [
        "s = asd; e;",
        "a;",
        "b;",
        "c;",
    ].join("\n");
    const output = formatText(input, {
        startLine: 1,
        endLine: 999999,
        forceSplitStatements: true,
        separateBlocks: false,
    });

    assert.strictEqual(output, [
        "s = asd;",
        "e;",
        "a;",
        "b;",
        "c;",
    ].join("\n"));
}

function testForceSplitStatementsWorksWithAutoAppendSemicolon() {
    const input = [
        "s = asd; e",
        "a;",
        "b;",
        "c;",
    ].join("\n");
    const output = formatText(input, {
        startLine: 1,
        endLine: 999999,
        forceSplitStatements: true,
        autoAppendSemicolon: true,
        separateBlocks: false,
    });

    assert.strictEqual(output, [
        "s = asd;",
        "e;",
        "a;",
        "b;",
        "c;",
    ].join("\n"));
}

function testForceSplitStatementsSkipsMatrixSemicolons() {
    const input = "M = [1 2; 3 4]; e;";
    const output = formatText(input, {
        startLine: 1,
        endLine: 999999,
        forceSplitStatements: true,
        separateBlocks: false,
    });

    assert.strictEqual(output, [
        "M = [1 2; 3 4];",
        "e;",
    ].join("\n"));
}

function testAutoAppendSemicolonSkipsFunctionContinuationLine() {
    const input = [
        "function y = f(x1, ...",
        " x2)",
        "y = x1 + x2;",
        "end",
    ].join("\n");
    const output = formatText(input, {
        startLine: 1,
        endLine: 999999,
        autoAppendSemicolon: true,
        separateBlocks: false,
    });

    assert.strictEqual(output, [
        "function y = f(x1, ...",
        "        x2)",
        "    y = x1 + x2;",
        "end",
    ].join("\n"));
}

function testForceSplitInlineIfPreservesBodySemicolons() {
    const output = formatText("if x, y=z; else y = h; end", {
        startLine: 1,
        endLine: 999999,
        forceSplitStatements: true,
        autoAppendSemicolon: true,
        removeUnnecessarySemicolons: true,
        separateBlocks: false,
    });

    assert.strictEqual(output, [
        "if x",
        "    y = z;",
        "else",
        "    y = h;",
        "end",
    ].join("\n"));
}

function testForceSplitInlineIfWithoutElsePreservesBodySemicolon() {
    const output = formatText("if x, y=z;  end", {
        startLine: 1,
        endLine: 999999,
        forceSplitStatements: true,
        autoAppendSemicolon: true,
        removeUnnecessarySemicolons: true,
        separateBlocks: false,
    });

    assert.strictEqual(output, [
        "if x",
        "    y = z;",
        "end",
    ].join("\n"));
}

function testAutoAppendSemicolonSkipsInlineIfWhenNotSplittingStatements() {
    const output = formatText("visStr = 'off'; if isVisible, visStr = 'on'; end", {
        startLine: 1,
        endLine: 999999,
        autoAppendSemicolon: true,
        separateBlocks: false,
    });

    assert.strictEqual(output, "visStr = 'off'; if isVisible, visStr = 'on'; end");
}

function testForceSplitInlineIfAfterRegularStatementAddsBodySemicolon() {
    const output = formatText("visStr = 'off'; if isVisible, visStr = 'on'; end", {
        startLine: 1,
        endLine: 999999,
        forceSplitStatements: true,
        autoAppendSemicolon: true,
        removeUnnecessarySemicolons: true,
        separateBlocks: false,
    });

    assert.strictEqual(output, [
        "visStr = 'off';",
        "if isVisible",
        "    visStr = 'on';",
        "end",
    ].join("\n"));
}

function run() {
    testDefaultFixtureFormats();
    testAutoAppendSemicolonForRegularStatements();
    testAutoAppendSemicolonSkipsContinuationAndExistingSemicolons();
    testAutoAppendSemicolonPreservesStringsCommentsAndMatrices();
    testAutoAppendSemicolonIgnoresMixedQuotedAndUnquotedCommentText();
    testAutoAppendSemicolonSkipsImportStatements();
    testRemoveUnnecessarySemicolonsForStructuralLines();
    testRemoveUnnecessarySemicolonsPreservesStatementSemicolons();
    testEndKeywordInsideIndexDoesNotTriggerInlineControlFlow();
    testForceSplitStatementsBreaksTopLevelStatementsIntoLines();
    testForceSplitStatementsWorksWithAutoAppendSemicolon();
    testForceSplitStatementsSkipsMatrixSemicolons();
    testAutoAppendSemicolonSkipsFunctionContinuationLine();
    testForceSplitInlineIfPreservesBodySemicolons();
    testForceSplitInlineIfWithoutElsePreservesBodySemicolon();
    testAutoAppendSemicolonSkipsInlineIfWhenNotSplittingStatements();
    testForceSplitInlineIfAfterRegularStatementAddsBodySemicolon();
    console.log("formatter ok");
}

run();
