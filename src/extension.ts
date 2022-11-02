// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {openScratchOrg, sourcePushMetadata, createScratchOrg, importDummyData, deployUnpackagable, assignPermsets, generateLoginLink, sourcePullMetadata, createProject} from './commands';
import { installDependencies, inputUpdateDependencyKey, addDependency, IS_MULTI_PCKG_DIRECTORY, getPackageDirectories } from './packageCommands';
import { dxmateOutput, folderExists, workspacePath } from './utils';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	checkContext();
	registerOrgCommands(context);

	vscode.commands.executeCommand("setContext", "extensionActivated", true);
}

function checkContext() {
	vscode.commands.executeCommand("setContext", "hasSfdxProject", folderExists(workspacePath + '/sfdx-project.json'));
}

function registerOrgCommands(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.commands.registerCommand('dxmate.openScratch', () => {
		openScratchOrg();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('dxmate.createProject', () => {
		createProject();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('dxmate.createScratch', () => {
		setupScratchOrg();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('dxmate.dependencyInstall', () => {
		installDependencies();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('dxmate.updateDependencyKey', () => {
		inputUpdateDependencyKey();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('dxmate.pullSource', () => {
		sourcePullMetadata();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('dxmate.pushSource', () => {
		sourcePushMetadata();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('dxmate.importDummyData', () => {
		importDummyData();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('dxmate.assignPermissionsets', () => {
		assignPermsets();
	}));
	context.subscriptions.push(vscode.commands.registerCommand('dxmate.scratchLoginLink', () => {
		generateLoginLink();
	}));
	context.subscriptions.push(vscode.commands.registerCommand('dxmate.addDependency', () => {
		addDependency();
	}));
}

async function setupScratchOrg() {
	console.log('MULTI PACKAGE REPO? ' + IS_MULTI_PCKG_DIRECTORY());
	if(IS_MULTI_PCKG_DIRECTORY() === true) {
		const packageDirectory = await getPackageDirectoryInput();
		if(!packageDirectory) {
			return; //User cancelled
		}
	}

	vscode.window.showInputBox({
		title: 'Scratch org alias',
		placeHolder: "MYSCRATCH",
	}).then(value => {
		if(!value){
			return;//Cancelled
		}
		createScratchOrg(value as string).then( out => {
			installDependencies().then( out => {
				sourcePushMetadata().then( out => {
					deployUnpackagable().then( out => {
						openScratchOrg();
						//Automatically assign default permission sets. This needs to complete before importing dummy data
						assignPermsets().then(out => {
							importDummyData();
						});
					});
				})
			});
		});
	});
}

async function getPackageDirectoryInput() {
	let directories = getPackageDirectories();
	let dirMap = new Map();
	let packageNames: string[] = [];

	if(directories && directories.length > 0) {
		directories.forEach(directory => {
			dirMap.set(directory.package, directory);
			packageNames.push(directory.package);
		});
		console.log(packageNames);
	}
	else{
		dxmateOutput.appendLine('Error getting package directories');
		return;
	}


	return vscode.window.showQuickPick(packageNames, {
		title: 'Select package directory',
		canPickMany: false,
	}).then((selectedDirectory) => {
		return selectedDirectory ? dirMap.get(selectedDirectory) : null;
	});
}

// this method is called when your extension is deactivated
export function deactivate() {}
