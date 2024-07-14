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
function activate(context) {
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
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map