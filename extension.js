const vscode = require('vscode');
const { createSdkUtilFile } = require('./sdkGenerator');

function activate(context) {
    let disposable = vscode.commands.registerCommand('chatbot.openChat', function () {
        const panel = vscode.window.createWebviewPanel(
            'chatbot',
            'SDK Generator Chatbot',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(
            async message => {
                if (message.command === 'sendMessage') {
                    await processMessage(message.text, panel);
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

async function processMessage(message, panel) {
    try {
        console.log(message)
        // Show processing message
        panel.webview.postMessage({
            command: 'receiveMessage',
            text: '🔄 Step 1/3: Generating SDK utility code...'
        });

        // Small delay to show first message
        await new Promise(resolve => setTimeout(resolve, 500));

        panel.webview.postMessage({
            command: 'receiveMessage',
            text: '🔄 Step 2/3: Scanning your workspace files...'
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        panel.webview.postMessage({
            command: 'receiveMessage',
            text: '🔄 Step 3/3: Getting detailed integration instructions...'
        });
        
        // Call the SDK generator
        const result = await createSdkUtilFile(message);
        
        // Send success response
        panel.webview.postMessage({
            command: 'receiveMessage',
            text: result
        });
    } catch (error) {
        panel.webview.postMessage({
            command: 'receiveMessage',
            text: `❌ Error: ${error.message}`
        });
    }
}

function getWebviewContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SDK Generator Chatbot</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        h2 {
            margin-bottom: 10px;
        }
        .info {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textLink-foreground);
            padding: 10px;
            margin-bottom: 20px;
            font-size: 12px;
        }
        #chatContainer {
            height: 500px;
            overflow-y: auto;
            border: 1px solid var(--vscode-panel-border);
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
            background-color: var(--vscode-editor-background);
        }
        .message {
            margin: 8px 0;
            padding: 8px 12px;
            border-radius: 8px;
            max-width: 90%;
            word-wrap: break-word;
            white-space: pre-wrap;
            font-size: 13px;
            line-height: 1.5;
        }
        .user-message {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            margin-left: auto;
            text-align: right;
        }
        .bot-message {
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
        }
        #inputContainer {
            display: flex;
            gap: 10px;
        }
        #messageInput {
            flex: 1;
            padding: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
        }
        #sendButton {
            padding: 8px 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        #sendButton:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        #sendButton:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <h2>SDK Generator Chatbot</h2>
    <div class="info">
        💡 Example: "Generate sendgrid util" or "Create stripe SDK for python"
    </div>
    <div id="chatContainer"></div>
    <div id="inputContainer">
        <input type="text" id="messageInput" placeholder="Type SDK name or request..." />
        <button id="sendButton">Send</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const chatContainer = document.getElementById('chatContainer');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        function addMessage(text, isUser) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + (isUser ? 'user-message' : 'bot-message');
            messageDiv.textContent = text;
            chatContainer.appendChild(messageDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function sendMessage() {
            const text = messageInput.value.trim();
            if (text) {
                addMessage(text, true);
                vscode.postMessage({
                    command: 'sendMessage',
                    text: text
                });
                messageInput.value = '';
                sendButton.disabled = true;
            }
        }

        sendButton.addEventListener('click', sendMessage);
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'receiveMessage') {
                addMessage(message.text, false);
                sendButton.disabled = false;
            }
        });
    </script>
</body>
</html>`;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}
