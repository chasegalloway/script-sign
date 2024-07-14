import * as vscode from 'vscode';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.workspace.onDidSaveTextDocument((document) => {
        const filePath = document.fileName;
        const currentUser = process.env.USER || process.env.USERNAME || 'Unknown User';
        const now = new Date();
        const nowString = now.toLocaleString();

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                vscode.window.showErrorMessage(`Error reading file: ${err.message}`);
                return;
            }

            let lines = data.split('\n');
            let createdLineIndex = lines.findIndex(line => line.startsWith('// Created by '));
            let modifiedLineIndex = lines.findIndex(line => line.startsWith('// Last modified by '));

            if (createdLineIndex === -1) {
                lines.unshift(`// Created by ${currentUser} on ${nowString}`);
                createdLineIndex = 0;
            }

            if (modifiedLineIndex !== -1) {
                lines.splice(modifiedLineIndex, 1);
            }

            lines.splice(createdLineIndex + 1, 0, `// Last modified by ${currentUser} on ${nowString}`);

            const newContent = lines.join('\n');
            fs.writeFile(filePath, newContent, (err) => {
                if (err) {
                    vscode.window.showErrorMessage(`Error writing file: ${err.message}`);
                }
            });
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
