# VSCode AI 助手插件

这是一个模仿 GitHub Copilot 功能的 VSCode 插件，提供智能代码补全和对话功能。

## 功能特性

### 1. AI 对话窗口
- 快捷键：`Ctrl+Alt+C`（Windows/Linux）或 `Cmd+Alt+C`（Mac）
- 在编辑器右侧打开对话窗口
- 支持与 AI 助手进行对话
- 可以将 AI 回复插入到当前文档
- 自动保存对话历史

### 2. 快速输入框
- 快捷键：`Ctrl+Alt+V`（Windows/Linux）或 `Cmd+Alt+V`（Mac）
- 在编辑器中打开浮动输入框
- 支持自动补全建议
- 快速替换选中的文本

### 3. Copilot 风格对话框
- 快捷键：`Ctrl+K`（Windows/Linux）或 `Cmd+K`（Mac）
- 类似 GitHub Copilot 的交互体验
- 基于选中代码生成建议
- 支持代码生成和转换

## 开发环境设置

### 前置要求
- Node.js (推荐 v14 或更高版本)
- Visual Studio Code
- Git

### 安装依赖
```bash
# 克隆项目
git clone <repository-url>

# 安装依赖
npm install
# 或
yarn install
```

## 调试方法

1. **使用 VSCode 调试**
   - 在 VSCode 中打开项目
   - 按 `F5` 启动调试
   - 将打开一个新的 VSCode 窗口，其中加载了该插件

2. **查看调试输出**
   - 在调试实例中，打开命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`）
   - 输入 "Developer: Toggle Developer Tools"
   - 查看控制台输出和错误信息

3. **修改代码后重新加载**
   - 在调试窗口中按 `Ctrl+R` 或 `Cmd+R` 重新加载窗口
   - 或在命令面板中执行 "Developer: Reload Window"

4. **常见问题排查**
   - 检查 `package.json` 中的命令和快捷键配置
   - 查看 VSCode 的扩展输出面板（Output -> hello-vscode）
   - 确认 `activationEvents` 配置正确

## 项目结构
```
hello-vscode/
├── src/
│   ├── extension.ts      # 插件主入口
│   └── webview/
│       └── chat/         # 对话窗口相关文件
│           ├── index.html
│           ├── styles.css
│           └── script.js
├── package.json         # 插件配置文件
└── README.md           # 说明文档
```

## 开发注意事项

1. **代码修改**
   - 修改 TypeScript 文件后需要重新编译
   - 使用 `npm run watch` 或 `yarn watch` 启动自动编译

2. **调试技巧**
   - 使用 `console.log` 输出调试信息
   - 在代码中设置断点
   - 使用 VSCode 的调试控制台查看变量

3. **发布准备**
   - 更新 `package.json` 中的版本号
   - 确保所有功能都经过测试
   - 编写更新日志

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交改动
4. 发起 Pull Request

## 许可证

[MIT License](LICENSE)
