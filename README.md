# MATLAB Formatter Plus

为 Visual Studio Code 设计的 matlab 代码格式化插件，基于 [matlab-formatter-vscode](https://github.com/affenwiesel/matlab-formatter-vscode) 修改，相较原版具有如下特性

- 完全基于 js 实现，**移除 python 环境依赖**
- 新增 **end 对齐、空行插入、强制空行移除、分号自动添加/移除** 等功能，详细效果见下文 **配置说明**

演示效果如下

![sample](https://image.krins.cloud/fcccd14dd2df2548e460b61510d8b3c1.gif)

## 环境依赖
- Visual Studio Code 1.20 及以上版本

## 插件设置
|                         indentwidth                          |                          indentMode                          |                          addSpaces                           |
| :----------------------------------------------------------: | :----------------------------------------------------------: | :----------------------------------------------------------: |
|                           缩进宽度                           |  缩进所有函数、仅缩进嵌套函数，<br />或不在任何函数内部缩进  | 选择哪些运算符应用空格包裹：<br />所有运算符、除幂运算符（^, .^）外的所有运算符，<br />或不包裹任何运算符 |
| ![sample](https://image.krins.cloud/56484099c8685b6735a397dd3ae07f31.gif) | ![sample](https://image.krins.cloud/ae0563ebd142f2d9a1209f7ec6ebab2d.gif) | ![sample](https://image.krins.cloud/d9583d0cc2e7abfb5ad6135dd1cdfed5.gif) |
|                       **matrixIndent**                       |                      **separateBlocks**                      |               **insertBlankLineBeforeBlocks**                |
|     选择矩阵的缩进方式：保持所有行对齐，或仅使用一级缩进     |                     块之间是否自动留空行                     |         在 if、for 和 try 等代码块开始前插入一个空行         |
| ![sample](https://image.krins.cloud/f6c72ee3f3c7e16844bedc11ed90f780.gif) | ![sample](https://image.krins.cloud/203128b4c872863daef5b1c90452d2cd.gif) | ![sample](https://image.krins.cloud/fe1ab3a9799a03959b7fcf81759126c7.gif) |
|                **insertBlankLineAfterBlocks**                |       **allowBlankLineBetweenConsecutiveBlockStarts**        |        **allowBlankLineBetweenConsecutiveBlockEnds**         |
|                   在块结束之后插入一个空行                   | 允许或禁止连续嵌套块起始之间的空行，<br />例如紧接另一个 for 的 for | 允许或禁止连续嵌套块结束符<br />（如一个 end 紧接另一个 end）<br />之间的空行 |
| ![sample](https://image.krins.cloud/47a1f66e0e9c983ecd1d310e5bde9018.gif) | ![sample](https://image.krins.cloud/57fc9cfeeb4b108f0eca7ea88859bb0c.gif) | ![sample](https://image.krins.cloud/0eb66a084a5eb2ace1e4ecad06d5e262.gif) |
|              **squeezeBlankAfterControlBlocks**              |             **squeezeBlankAfterFunctionBlocks**              |                   **autoAppendSemicolon**                    |
|           强制移除控制语句（if、for）后紧跟的空行            |          强制移除 function 和 classdef 后紧跟的空行          |   为符合条件的语句末尾添加分号，<br />以抑制命令行窗口输出   |
| ![sample](https://image.krins.cloud/c0e4c262075f72be3eb330cb23366f75.gif) | ![sample](https://image.krins.cloud/203128b4c872863daef5b1c90452d2cd.gif) | ![sample](https://image.krins.cloud/e62963eae10fb74309bacfb2c42bfc04.gif) |
|               **removeUnnecessarySemicolons**                |                                                              |                                                              |
| 为 if、elseif、else、catch、function、classdef 和 end 语句<br />去除不必要的分号 |                                                              |                                                              |
| ![sample](https://image.krins.cloud/437c83b44ca0df559d45fb4363db1ce2.gif) |                                                              |                                                              |

## 额外配置
* 可以通过添加注释 `formatter ignore N` 为选定的行关闭格式化程序。在接下来的 N 行中仅会修正缩进，其余部分保持不变
