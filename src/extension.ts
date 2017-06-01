'use strict';

import * as vscode from 'vscode';

import {
  resolveSourceRootDirs,
} from './helpers';
import SourceFileManager from './source-file-manager';

let sourceFileManager: SourceFileManager | undefined;

let uid = 0;
let histories: { [key: string]: number } = {};

export function activate(context: vscode.ExtensionContext) {
  getSourceFileManager();

  vscode.window.onDidChangeActiveTextEditor(textEditor => {
    let document = textEditor.document;

    histories[document.fileName] = ++uid;
  });

  let disposable = vscode.commands.registerCommand('ngUtils.switchFilesWithSameName', async () => {
    let activeTextEditor = vscode.window.activeTextEditor;

    if (!activeTextEditor) {
      return;
    }

    let activeDocument = activeTextEditor.document;
    let filename = activeDocument.fileName;

    let selectItemsPromise = SourceFileManager.resolveSameNameFiles(filename)
      .then(files => {
        let items = files.map(file => ({
          label: file.filename,
          description: file.kind,
          file,
        }));

        items.sort((a, b) => {
          return histories[a.file.absolutePath] > histories[b.file.absolutePath] ? -1 : 1;
        });

        return items;
      });

    let selectItem = await vscode.window.showQuickPick(selectItemsPromise, {
      placeHolder: 'Select a file',
    });

    if (!selectItem) {
      return;
    }

    let nextDocument = await vscode.workspace.openTextDocument(selectItem.file.absolutePath);

    vscode.window.showTextDocument(nextDocument, activeTextEditor.viewColumn);
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {
  if (sourceFileManager) {
    sourceFileManager.destroy();
  }

  sourceFileManager = undefined;
}

function getSourceFileManager(): SourceFileManager | undefined {
  if (!sourceFileManager && vscode.workspace.rootPath) {
    sourceFileManager = new SourceFileManager(
      resolveSourceRootDirs(vscode.workspace.rootPath),
    );
  }

  return sourceFileManager;
}
