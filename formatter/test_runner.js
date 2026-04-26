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

function run() {
    testDefaultFixtureFormats();
    testAutoAppendSemicolonForRegularStatements();
    testAutoAppendSemicolonSkipsContinuationAndExistingSemicolons();
    testAutoAppendSemicolonPreservesStringsCommentsAndMatrices();
    testAutoAppendSemicolonSkipsImportStatements();
    testRemoveUnnecessarySemicolonsForStructuralLines();
    testRemoveUnnecessarySemicolonsPreservesStatementSemicolons();
    console.log("formatter ok");
}

run();
