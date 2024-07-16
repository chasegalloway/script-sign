"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
// Map of file extensions to their comment styles
const commentStyles = {
    'cpp': { start: '// ' },
    'javascript': { start: '// ' },
    'typescript': { start: '// ' },
    'java': { start: '// ' },
    'csharp': { start: '// ' },
    'go': { start: '// ' },
    'php': { start: '// ' },
    'html': { start: '<!-- ', end: ' -->' },
    'xml': { start: '<!-- ', end: ' -->' },
    'css': { start: '/* ', end: ' */' },
    'ruby': { start: '# ' },
    'shellscript': { start: '# ' },
    'powershell': { start: '# ' },
    'python': { start: '# ' },
};
function getCommentStyle(languageId) {
    return commentStyles[languageId];
}
function activate(context) {
    // Register the save event handler
    let disposable = vscode.workspace.onDidSaveTextDocument((document) => {
        const filePath = document.fileName;
        const excludedFiles = context.workspaceState.get('excludedFiles', []);
        if (excludedFiles.includes(filePath)) {
            return;
        }
        const currentUser = context.workspaceState.get('signingName', process.env.USER || process.env.USERNAME || 'Unknown User');
        const now = new Date();
        const nowString = now.toLocaleString();
        const commentStyle = getCommentStyle(document.languageId);
        if (!commentStyle) {
            vscode.window.showErrorMessage(`Unsupported file type: ${document.languageId}`);
            return;
        }
        const commentStart = commentStyle.start;
        const commentEnd = commentStyle.end ? commentStyle.end : '';
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                vscode.window.showErrorMessage(`Error reading file: ${err.message}`);
                return;
            }
            let lines = data.split('\n');
            let createdLineIndex = lines.findIndex(line => line.startsWith(`${commentStart}Created by `));
            let modifiedLineIndex = lines.findIndex(line => line.startsWith(`${commentStart}Last modified by `));
            if (createdLineIndex === -1) {
                lines.unshift(`${commentStart}Created by ${currentUser} on ${nowString}${commentEnd}`);
                createdLineIndex = 0;
            }
            if (modifiedLineIndex !== -1) {
                lines.splice(modifiedLineIndex, 1);
            }
            lines.splice(createdLineIndex + 1, 0, `${commentStart}Last modified by ${currentUser} on ${nowString}${commentEnd}`);
            const newContent = lines.join('\n');
            fs.writeFile(filePath, newContent, (err) => {
                if (err) {
                    vscode.window.showErrorMessage(`Error writing file: ${err.message}`);
                }
            });
        });
    });
    context.subscriptions.push(disposable);
    // Register the command to open the settings panel
    context.subscriptions.push(vscode.commands.registerCommand('my-extension.openSettings', () => {
        const panel = vscode.window.createWebviewPanel('scriptSignSidebar', 'Script Sign Settings', vscode.ViewColumn.One, {
            enableScripts: true
        });
        panel.webview.html = getWebviewContent(context);
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'saveSettings':
                    context.workspaceState.update('signingName', message.signingName);
                    context.workspaceState.update('excludedFiles', message.excludedFiles);
                    vscode.window.showInformationMessage('Settings saved successfully!');
                    return;
            }
        }, undefined, context.subscriptions);
    }));
}
exports.activate = activate;
function getWebviewContent(context) {
    const signingName = context.workspaceState.get('signingName', '');
    const excludedFiles = context.workspaceState.get('excludedFiles', []);
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>My Extension Settings</title>
    </head>
    <body>
        <h1>My Extension Settings</h1>
        <form id="settingsForm">
            <label for="signingName">Signing Name:</label>
            <input type="text" id="signingName" name="signingName" value="${signingName}"><br><br>
            <label for="excludedFiles">Excluded Files (comma separated):</label>
            <textarea id="excludedFiles" name="excludedFiles" rows="4" cols="50">${excludedFiles.join(', ')}</textarea><br><br>
            <button type="submit">Save Settings</button>
        </form>
        <script>
            const vscode = acquireVsCodeApi();

            document.getElementById('settingsForm').addEventListener('submit', (e) => {
                e.preventDefault();
                const signingName = document.getElementById('signingName').value;
                const excludedFiles = document.getElementById('excludedFiles').value.split(',').map(file => file.trim());
                vscode.postMessage({
                    command: 'saveSettings',
                    signingName: signingName,
                    excludedFiles: excludedFiles
                });
            });
        </script>
    </body>
    </html>
    `;
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map