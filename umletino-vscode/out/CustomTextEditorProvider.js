"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
var globalContext;
class UmletEditorProvider {
    constructor(context) {
        this.context = context;
    }
    static register(context) {
        const provider = new UmletEditorProvider(context);
        //Override VSCodes built-in save functionality
        globalContext = context;
        provider.consoleLog('asdasd');
        context.subscriptions.push(clipboardCopyDisposable);
        context.subscriptions.push(clipboardPasteDisposable);
        provider.consoleLog('asdasd');
        const providerRegistration = vscode.window.registerCustomEditorProvider(UmletEditorProvider.viewType, provider);
        return providerRegistration;
    }
    consoleLog(params) {
        var channel = vscode.window.createOutputChannel('myoutputchannel');
        channel.appendLine('new clip pushg');
        channel.show();
    }
    /**
       * Called when our custom editor is opened.
       *
       */
    resolveCustomTextEditor(document, webviewPanel, token) {
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'src', 'umlet-gwt'))]
        };
        let WebviewPanelOptions = webviewPanel.options;
        WebviewPanelOptions = {
            retainContextWhenHidden: true
        };
        // Handle messages from the webview
        webviewPanel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'exportUxf':
                    this.SaveFile(message.text);
                    return;
                case 'updateFiledataUxf':
                    this.UpdateCurrentFile(message.text, document);
                    return;
                case 'exportPng':
                    var actual_data = message.text.replace("data:image/png;base64,", "");
                    this.SaveFileDecode(actual_data);
                    return;
            }
        }, undefined, this.context.subscriptions);
        // Get path to resource on disk
        const onDiskPath = vscode.Uri.file(path.join(this.context.extensionPath, 'src', 'umlet-gwt'));
        // And get the special URI to use with the webview
        const localUmletFolder = webviewPanel.webview.asWebviewUri(onDiskPath);
        let fileContents = document.getText().toString();
        webviewPanel.webview.html = this.GetUmletWebviewPage(localUmletFolder.toString(), fileContents.toString());
    }
    /*
    function startUmlet(context: vscode.ExtensionContext, fileContents: string, fileName: string): WebviewPanel {
    
      const panel = vscode.window.createWebviewPanel('umlet', fileName, vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'src', 'umlet-gwt'))]
      });
      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
          case 'exportUxf':
            SaveFile(message.text);
            return;
          case 'exportPng':
            var actual_data = message.text.replace("data:image/png;base64,", "");
            SaveFileDecode(actual_data);
            return;
        }
      }, undefined, context.subscriptions);
    
      // Get path to resource on disk
      const onDiskPath = vscode.Uri.file(path.join(context.extensionPath, 'src', 'umlet-gwt'));
      // And get the special URI to use with the webview
      const localUmletFolder = panel.webview.asWebviewUri(onDiskPath);
    
      if (fileContents === undefined) {
        panel.webview.html = GetUmletWebviewPage(localUmletFolder.toString(), 'undefined'); //TODO not working, loads uninteractable umletino without borders
      } else {
        panel.webview.html = GetUmletWebviewPage(localUmletFolder.toString(), fileContents.toString());
      }
      return panel;
    }
    */
    //gets the updated filedata from the webview if anything has changed
    UpdateCurrentFile(fileContent, document) {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), fileContent);
        return vscode.workspace.applyEdit(edit);
    }
    //shows popup savefile dialog for uxf files
    SaveFile(fileContent) {
        vscode.window.showSaveDialog({
            filters: {
                'UML Diagram': ['uxf']
            }
        })
            .then(fileInfos => {
            if (fileInfos !== undefined) {
                fs.writeFile(fileInfos.fsPath, fileContent, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                });
            }
        });
    }
    //shows popup savefile dialog for png files
    SaveFileDecode(fileContent) {
        vscode.window.showSaveDialog({
            filters: {
                'Image': ['png']
            }
        })
            .then(fileInfos => {
            if (fileInfos !== undefined) {
                fs.writeFile(fileInfos.fsPath, fileContent, { encoding: 'base64' }, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                });
            }
        });
    }
    /**
      *
      * Gets a modified version of the initial starting page of the GWT umletino version
      * @param localUmletFolder folder which holds the local umletino gwt version.
      * @param diagramData XML data of a diagram which should be loaded on start
      */
    GetUmletWebviewPage(localUmletFolder, diagramData) {
        return `<!DOCTYPE html>
  <html>
    <head>
      <base href="${localUmletFolder}/" />
      <meta name="viewport" content="user-scalable=no" />
      <meta http-equiv="content-type" content="text/html; charset=UTF-8">
      <link type="text/css" rel="stylesheet" href="umletino.css">
      <link rel="icon" type="image/x-icon" href="favicon.ico">
      <title>UMLetino - Free Online UML Tool for Fast UML Diagrams</title>
      <script type="text/javascript" src="baseletgwt/baseletgwt.nocache.js?2020-03-15_09-48-08"></script>
    </head>
    <body>
      <!-- the following line is necessary for history support -->
      <iframe src="javascript:''" id="__gwt_historyFrame" tabIndex='-1' style="position:absolute;width:0;height:0;border:0"></iframe>
      
      <!-- the website will not work without JavaScript -->
      <noscript>
        <div style="width: 25em; position: absolute; left: 50%; margin-left: -11em; background-color: white; border: 1px solid red; padding: 4px; font-family: sans-serif">
          You must enable JavaScript to use this web application.
      </div>
      </noscript>
      <div align="left" id="featurewarning" style="color: red; font-family: sans-serif; font-weight:bold; font-size:1.2em"></div>
      
    </body>
    <script>
      function getTheme() {
        switch(document.body.className) {
          case 'vscode-light':
            return 'LIGHT'; 
          case 'vscode-dark':
          case 'vscode-hight-contrast':
            return 'DARK';
          default:
            return 'LIGHT';
        }
      }

      function switchBodyColor(theme) {
        switch(theme) {
          case 'DARK':
            document.body.style.backgroundColor = 'black';
            break;
          case 'LIGHT':
            document.body.style.backgroundColor = '';
            break;
          default:
            document.body.style.backgroundColor = '';
        }
      }

      // Observing theme changes
      var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutationRecord) {
            var themeFromClass = getTheme(document.body.className);
            window.changeTheme(themeFromClass);
            switchBodyColor(themeFromClass);
        });    
      });
      
      var target = document.body;
      observer.observe(target, { attributes : true, attributeFilter : ['class'] });

      // Retrieving current theme
      var theme = 'LIGHT';
      theme = getTheme(document.body.className);
      switchBodyColor(theme);

      var vscode = acquireVsCodeApi();
      var vsCodeInitialDiagramData = \`${diagramData}\`;
    </script>

  </html>`;
    }
}
exports.UmletEditorProvider = UmletEditorProvider;
UmletEditorProvider.viewType = 'uxfCustoms.umletEditor';
//Has to be set to true, so copy paste commands via keyboard are registered by vs code
vscode.commands.executeCommand('setContext', 'textInputFocus', true);
//override the editor.action.clipboardCopyAction with our own
var clipboardCopyDisposable = vscode.commands.registerTextEditorCommand('editor.action.clipboardCopyAction', overriddenClipboardCopyAction);
/*
 * Function that overrides the default copy behavior. We get the selection and use it, dispose of this registered
 * command (returning to the default editor.action.clipboardCopyAction), invoke the default one, and then re-register it after the default completes
 */
function overriddenClipboardCopyAction(textEditor, edit, params) {
    //debug
    //Write to output.
    console.log("Copy registered");
    //dispose of the overridden editor.action.clipboardCopyAction- back to default copy behavior
    clipboardCopyDisposable.dispose();
    //execute the default editor.action.clipboardCopyAction to copy
    vscode.commands.executeCommand("editor.action.clipboardCopyAction").then(function () {
        console.log("After Copy");
        //add the overridden editor.action.clipboardCopyAction back
        clipboardCopyDisposable = vscode.commands.registerTextEditorCommand('editor.action.clipboardCopyAction', overriddenClipboardCopyAction);
        //complains about globalConext beeing undefined, not needed? seems to work fine without
        //globalContext.subscriptions.push(clipboardCopyDisposable);
    });
}
//override the editor.action.clipboardPasteAction with our own
var clipboardPasteDisposable = vscode.commands.registerTextEditorCommand('editor.action.clipboardPasteAction', overriddenClipboardPasteAction);
/*
 * Function that overrides the default paste behavior. We get the selection and use it, dispose of this registered
 * command (returning to the default editor.action.clipboardPasteAction), invoke the default one, and then re-register it after the default completes
 */
function overriddenClipboardPasteAction(textEditor, edit, params) {
    //debug
    //Write to output.
    console.log("Paste registered");
    //dispose of the overridden editor.action.clipboardPasteAction- back to default paste behavior
    clipboardPasteDisposable.dispose();
    //execute the default editor.action.clipboardPasteAction to paste
    vscode.commands.executeCommand("editor.action.clipboardPasteAction").then(function () {
        console.log("After Paste");
        //add the overridden editor.action.clipboardPasteAction back
        clipboardPasteDisposable = vscode.commands.registerTextEditorCommand('editor.action.clipboardPasteAction', overriddenClipboardPasteAction);
        //complains about globalConext beeing undefined, not needed? seems to work fine without
        //globalContext.subscriptions.push(clipboardPasteDisposable);
    });
}
//# sourceMappingURL=CustomTextEditorProvider.js.map