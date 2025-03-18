const vscode = acquireVsCodeApi();
const messages = document.getElementById('messages');
const input = document.getElementById('input');

let isFocused = false;

function autoFocus() {
    if (isFocused) return;
    input.focus();
    isFocused = true;
    
    input.addEventListener('blur', () => {
        isFocused = false;
    });
}

document.addEventListener('DOMContentLoaded', autoFocus);
window.addEventListener('load', autoFocus);

function appendMessage(text, isBot) {
    const div = document.createElement('div');
    div.className = `message ${isBot ? 'bot-message' : 'user-message'}`;
    div.innerHTML = `
        ${text}
        ${isBot ? '<button class="insert-btn" onclick="insertResponse(this)">插入</button>' : ''}
    `;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
}

function insertResponse(button) {
    const text = button.previousSibling.textContent;
    vscode.postMessage({ 
        command: 'insertResponse', 
        text: text.replace('插入', '') // 移除按钮文本
    });
}

function sendMessage() {
    const text = input.value.trim();
    if (text) {
        appendMessage(text, false);
        vscode.postMessage({ command: 'sendMessage', text });
        input.value = '';
        input.style.height = 'auto'; // 重置输入框高度
    }
}

// 回车发送 + Shift+Enter 换行
input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        if (event.shiftKey) {
            // 自适应高度
            input.style.height = 'auto';
            input.style.height = input.scrollHeight + 'px';
        } else {
            event.preventDefault();
            sendMessage();
        }
    }
});

window.addEventListener('message', event => {
    if (event.data.command === 'receiveMessage') {
        appendMessage(event.data.text, event.data.isBot);
    } else if (event.data.command === 'focusInput') {  // 新增条件判断
        autoFocus();
    } else if (event.data.command === 'receiveHistory') {
        appendMessage(event.data.text, event.data.isBot);
    }
});

context.subscriptions.push(vscode.commands.registerCommand('hello-vscode.clearHistory', () => {
  context.globalState.update('chatHistory', []);
}));
