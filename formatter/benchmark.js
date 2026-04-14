"use strict";

const fs = require("fs");
const path = require("path");
const { formatText } = require("./matlab_formatter");

const sourcePath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve(__dirname, "test.m");
const iterations = process.argv[3] ? Number.parseInt(process.argv[3], 10) : 200;
const input = fs.readFileSync(sourcePath, "utf8");

const options = {
    indentWidth: 4,
    separateBlocks: true,
    indentMode: "all_functions",
    addSpaces: "all_operators",
    matrixIndent: "aligned",
    insertBlankLineBeforeBlocks: true,
    insertBlankLineAfterBlocks: true,
    allowBlankLineBetweenConsecutiveBlockStarts: false,
    allowBlankLineBetweenConsecutiveBlockEnds: false,
    squeezeBlankAfterControlBlocks: false,
    squeezeBlankAfterFunctionBlocks: false,
    startLine: 1,
    endLine: Number.MAX_SAFE_INTEGER,
};

const start = process.hrtime.bigint();
for (let i = 0; i < iterations; i += 1) {
    formatText(input, options);
}
const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;

console.log(JSON.stringify({
    sourcePath,
    iterations,
    totalMs: Number(elapsedMs.toFixed(2)),
    averageMs: Number((elapsedMs / iterations).toFixed(3)),
}, null, 2));
