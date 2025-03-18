import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    console.log('恭喜，您的扩展"hello-vscode"已被激活！');

    let disposable = vscode.commands.registerCommand('hello-vscode.helloWorld', () => {
        vscode.window.showInformationMessage('你好，这是我的第一个 VSCode 插件！');
    });

    // 新增命令：显示选中内容
    let showSelection = vscode.commands.registerCommand('hello-vscode.showSelection', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('请先打开文件并选择文本');
            return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection);
        
        if (text) {
            vscode.window.showInformationMessage(`选中的内容：${text}`);
        } else {
            vscode.window.showWarningMessage('没有选中任何内容');
        }
    });

    // 添加对话框命令
    let openChat = vscode.commands.registerCommand('hello-vscode.openChat', () => {
        ChatPanel.createOrShow(context);
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(showSelection);
    context.subscriptions.push(openChat);
}

export function deactivate() {}

class ChatPanel {
  private static currentPanel: ChatPanel | undefined;
  private chatHistory: Array<{ text: string; isBot: boolean }> = [];

  private mockResponses = [
    "这是一个有趣的提问：",
    "正在处理您的请求：",
    "已收到以下内容：",
    "模拟回复示例："
  ];

  private insertTemplate = `// AI回复：{response}\n`;

  private lastInsertTime = 0;

  private getRandomResponse(text: string) {
    const prefix = this.mockResponses[Math.floor(Math.random() * this.mockResponses.length)];
    return `${prefix} ${text} ${new Date().toLocaleTimeString()}`;
  }

  public static createOrShow(context: vscode.ExtensionContext) {
    if (ChatPanel.currentPanel) {
      if (ChatPanel.currentPanel.panel.visible) {
        context.globalState.update('chatHistory', ChatPanel.currentPanel.chatHistory);
        ChatPanel.currentPanel.panel.dispose();
      } else {
        ChatPanel.currentPanel.panel.reveal();
        ChatPanel.currentPanel.restoreHistory();
      }
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'aiChat',
      'AI 助手',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    ChatPanel.currentPanel = new ChatPanel(panel, context);
    ChatPanel.currentPanel.restoreHistory();
  }

  private restoreHistory() {
    const history = this.context.globalState.get<Array<{ text: string; isBot: boolean }>>('chatHistory') || [];
    this.chatHistory = history;
    
    history.forEach(message => {
      this.panel.webview.postMessage({
        command: 'receiveHistory',
        text: message.text,
        isBot: message.isBot
      });
    });
  }

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    private readonly context: vscode.ExtensionContext
  ) {
    this.panel.onDidDispose(
      () => {
        this.context.globalState.update('chatHistory', this.chatHistory);
        ChatPanel.currentPanel = undefined;
        this.panel.dispose();
      },
      null,
      this.context.subscriptions
    );

    this.setupWebview();
  }

  private setupWebview() {
    try {
      this.panel.webview.html = this.getWebviewContent();
      
      this.panel.webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'sendMessage':
              this.handleUserMessage(message.text);
              break;
            case 'insertResponse':
              this.insertToDocument(message.text);
              break;
          }
        },
        undefined,
        this.context.subscriptions
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      vscode.window.showErrorMessage(`初始化失败: ${message}`);
      this.panel.dispose();
    }
  }

  private async handleUserMessage(text: string) {
    this.chatHistory.push({ text, isBot: false });
    
    try {
      // 生成模拟回复
      const mockResponse = this.getRandomResponse(text);
      
      // 添加1秒延迟
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 发送到对话框
      this.panel.webview.postMessage({
        command: 'receiveMessage',
        text: mockResponse,
        isBot: true
      });
      
      this.chatHistory.push({ text: mockResponse, isBot: true });

      await vscode.commands.executeCommand('editor.action.addCommentLine');
    } catch (error) {
      if (error instanceof Error && error.message.includes("Webview is disposed")) {
        vscode.window.showWarningMessage('对话窗口已关闭');
      }
    }
  }

  private async insertToDocument(text: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('没有打开的可编辑文件');
      return;
    }

    // 使用文档版本号检测变更
    const originalVersion = editor.document.version;
    
    try {
      // 重试机制（最多3次）
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        const document = editor.document;
        
        // 检查文档是否被修改
        if (document.version !== originalVersion) {
          vscode.window.showWarningMessage('文档已修改，正在重新尝试插入...');
        }

        // 获取最新文档状态
        const lastLine = document.lineAt(document.lineCount - 1);
        const position = lastLine.range.end;
        
        // 使用事务性编辑
        const success = await editor.edit(editBuilder => {
          editBuilder.insert(position, `\n// ${text}\n`);
        }, { undoStopBefore: false, undoStopAfter: true }); // 控制撤销点

        if (success) {
          // 滚动到插入位置
          const newPosition = position.with(position.line + 2, 0);
          editor.selection = new vscode.Selection(newPosition, newPosition);
          editor.revealRange(new vscode.Range(newPosition, newPosition));
          
          vscode.window.setStatusBarMessage('内容插入成功', 2000);
          return;
        }

        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 100)); // 短暂延迟后重试
      }

      throw new Error('插入操作失败，请重试');
      
    } catch (error) {
      let errorMessage = '插入失败';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      vscode.window.showErrorMessage(errorMessage);
      
      // 诊断日志
      console.error('插入失败详情:', {
        text,
        editor: editor.document.fileName,
        version: editor.document.version,
        isDirty: editor.document.isDirty,
        isClosed: editor.document.isClosed
      });
    }

    const now = Date.now();
    if (now - this.lastInsertTime < 500) {
      vscode.window.showWarningMessage('操作过于频繁');
      return;
    }
    this.lastInsertTime = now;

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "正在插入内容...",
      cancellable: false
    }, async () => {
      // 执行插入操作
    });
  }

  private getWebviewContent() {
    const htmlPath = path.join(this.context.extensionPath, 'src', 'webview', 'chat', 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');
    
    html = html
        .replace('styles.css', this.panel.webview.asWebviewUri(
            vscode.Uri.file(path.join(this.context.extensionPath, 'src', 'webview', 'chat', 'styles.css'))
        ).toString())
        .replace('script.js', this.panel.webview.asWebviewUri(
            vscode.Uri.file(path.join(this.context.extensionPath, 'src', 'webview', 'chat', 'script.js'))
        ).toString());

    return html;
  }

  private isPanelActive(): boolean {
    return this.panel !== null && 
           this.panel !== undefined && 
           this.panel.visible;
  }

  private debounceSend = this.debounce((text: string) => {
    if (this.isPanelActive()) {
      this.handleUserMessage(text);
    }
  }, 300);

  private debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
}

function getCodeContext() {
  const editor = vscode.window.activeTextEditor;
  return editor ? editor.document.getText() : '';
}

const config = vscode.workspace.getConfiguration('hello-vscode');
if (config.get('autoInsert')) {
  // 执行插入操作
} 

const isLocked = await vscode.workspace.fs.readFile(document.uri)
  .then(() => false)
  .catch(() => true);

if (isLocked) {
  vscode.window.showErrorMessage('文件被其他进程锁定');
  return;
} 