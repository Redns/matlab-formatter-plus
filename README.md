# MATLAB Formatter Plus

Indent and format MATLAB code.
Also usable as standalone without VScode.

This extension is modified from [affenwiesel/matlab-formatter-vscode](https://github.com/affenwiesel/matlab-formatter-vscode).

Added features in this edition:
- Improved `for/end`, `if/end`, `try/catch/end`, and range-formatting block alignment behavior
- Added settings to force-remove blank lines after control blocks and after `function`/`classdef`
- Added MATLAB language indentation rules in VS Code for better block editing experience

![IMAGE](images/example.gif)

## Requirements
- python 3.6

## Extension Settings
* `matlab-formatter-plus.indentwidth`: Number of spaces used for indentation.
* `matlab-formatter-plus.separateBlocks`: Control whether newlines should be added before and after blocks such as for, if, while and so on.
* `matlab-formatter-plus.indentMode`: Chose smart indentation mode: indent all functions, indent only nested functions, or don't indent inside any function.
* `matlab-formatter-plus.addSpaces`: Chose which operators should be wrapped with spaces: all operators, all but power (`^`, `.^`) or don't wrap any operators.
* `matlab-formatter-plus.matrixIndent`: Chose how matrices should be indented. Either keep all rows aligned or use only one level of indentation.
* `matlab-formatter-plus.squeezeBlankAfterControlBlocks`: Force-remove blank lines right after control blocks such as `if` and `for`.
* `matlab-formatter-plus.squeezeBlankAfterFunctionBlocks`: Force-remove blank lines right after `function` and `classdef`.

## Additional Options
* The formatter can be switched off for selected lines by adding the comment `formatter ignore N`. For the next `N` lines, only the indentation will be fixed. Other than that, they will not be altered.
