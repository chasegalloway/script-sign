import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface CommentStyle {
    start: string;
    end?: string;
}

// Map of file extensions to their comment styles
const commentStyles: { [key: string]: CommentStyle } = {
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

function getCommentStyle(languageId: string): CommentStyle | undefined {
    return commentStyles[languageId];
}

export function activate(context: vscode.ExtensionContext) {
    // Register the save event handler
    let disposable = vscode.workspace.onDidSaveTextDocument((document) => {
        const filePath = document.fileName;
        const excludedFiles: string[] = context.workspaceState.get('excludedFiles', []);
        if (excludedFiles.includes(filePath)) {
            return;
        }

        const currentUser: string = context.workspaceState.get('signingName', process.env.USER || process.env.USERNAME || 'Unknown User');
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
        const panel = vscode.window.createWebviewPanel(
            'scriptSignSidebar',
            'Script Sign Settings',
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );

        panel.webview.html = getWebviewContent(context);

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'saveSettings':
                        context.workspaceState.update('signingName', message.signingName);
                        context.workspaceState.update('excludedFiles', message.excludedFiles);
                        vscode.window.showInformationMessage('Settings saved successfully!');
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    }));
}

function getWebviewContent(context: vscode.ExtensionContext): string {
    const signingName: string = context.workspaceState.get('signingName', '');
    const excludedFiles: string[] = context.workspaceState.get('excludedFiles', []);

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

export function deactivate() {}
