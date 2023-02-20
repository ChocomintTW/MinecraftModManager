const { BrowserWindow, app, ipcMain, shell, dialog } = require('electron');
const Modrinth = require('./assets/js/modrinth');
const CurseForge = require('./assets/js/curseforge');
const DataSaver = require('./assets/js/data-saver');
const Minecraft = require('./assets/js/minecraft');
const Network = require('./assets/js/network');
const path = require('path');
const prompt = require('electron-prompt');
const ProgressBar = require('electron-progressbar');

let window;

// window initialize
async function initialize() {
	window = new BrowserWindow({
		width: 800,
		height: 600,
		icon: './assets/image/icon.png',
		webPreferences: {
			preload: path.join(__dirname, 'preload.js')
		},
		autoHideMenuBar: true,
		resizable: false
	});

	window.loadFile('index.html');
	// window.webContents.openDevTools();

	DataSaver.loadModsFromFile();
	window.webContents.send('mod-load-complete', DataSaver.mods.mods);

	DataSaver.loadInstancesFromFile();
	window.webContents.send('instance-load-complete', DataSaver.instances.instances);

	window.webContents.send('return-mvl', await Minecraft.initMinecraftVersionsList());

	// https://github.com/AndersonMamede/electron-progressbar#api
}

app.whenReady().then(async () => {
	if (await Network.checkOnline()) {
		initialize();

		app.on('activate', () => {
			if (BrowserWindow.getAllWindows().length == 0) initialize();
		});
	} else {
		await dialog.showMessageBox({
			title: ' ',
			type: 'error',
			buttons: ['OK'],
			message: 'Network Error!',
			detail: 'Please check your Internet connection!'
		});
		app.quit();
	}
});

app.on('window-all-closed', () => {
	DataSaver.saveModsToFile();
	DataSaver.saveInstancesToFile();

	if (process.platform != 'darwin') app.quit();
});

// Menu.setApplicationMenu(null);

// IPC
// https://ithelp.ithome.com.tw/articles/10235110?sc=iThomeR
ipcMain.handle('modrinth_add', async () => {
	const slug = await prompt({
		title: 'Add Modrinth Mod',
		label: 'Enter mod slug:',
		value: 'fabric-api',
		alwaysOnTop: true,
		inputAttrs: {
			type: 'text'
		},
		icon: './assets/image/modrinth.png',
		height: 180
	});
	
	if(slug == null) {
		console.log('user cancelled');
	} else {
		const title = DataSaver.modTitle(slug);
		if (title) {
			return {msg: title + ' already exists', id: slug};
		} else {
			try {
				const mod = await Modrinth.getProjectJson(slug);
				const loaders = await Modrinth.getLoaders(slug);
				DataSaver.addMod('Modrinth', slug, loaders, mod, mod.title);

				return {msg: 'Add ' + mod.title + ' successfully!', loaders: loaders, id: slug, modData: mod};
			} catch (error) {
				return {msg: error};
			}
		}
	}
});

ipcMain.handle('curseforge_add', async () => {
	const id = await prompt({
		title: 'Add CurseForge Mod',
		label: 'Enter mod id:',
		value: '238222',
		alwaysOnTop: true,
		inputAttrs: {
			type: 'text'
		},
		icon: './assets/image/curseforge.png',
		height: 180
	})

	if(id == null) {
		console.log('user cancelled');
	} else {
		const title = DataSaver.modTitle(id);
		if (title) {
			return {msg: title + ' already exists', id: id};
		} else {
			try {
				const mod = (await CurseForge.getProjectJson(id)).data;
				if (mod.gameId != 432) return {msg: 'Mod not found!'}; // is Minecraft's mod

				const loaders = (await CurseForge.getLoaders(id)).filter(value => value);
				DataSaver.addMod('CurseForge', id, loaders, mod, mod.name);

				return {msg: 'Add ' + mod.name + ' successfully!', loaders: loaders, id: id, modData: mod};
			} catch (error) {
				return {msg: error};
			}
		}
	}
});

ipcMain.on('open-ext-clicked', (event, url) => shell.openExternal(url));

ipcMain.handle('delete-mod', async (event, modId, title) => {
	// dialog
	let v = await dialog.showMessageBox(window, {
		title: ' ',
		type: 'warning',
		buttons: ['Yes', 'No'],
		message: 'Do you want to delete ' + title + '?'
	});
	if (v.response == 0) {
		DataSaver.deleteMod(modId);
		return true;
	} else {
		return false;
	}
});

ipcMain.on('save-instance', (event, instanceJson, mode, nowEdit) => {
	if (mode == 'add') DataSaver.instances.instances.push(instanceJson);
	if (mode == 'edit') {
		DataSaver.instances.instances = DataSaver.instances.instances.map(ins => {
			if (ins.hash == nowEdit) return instanceJson;
			return ins;
		});
	}
	event.returnValue = mode;
});

ipcMain.handle('delete-instance', async (event, ins) => {
	// dialog
	let v = await dialog.showMessageBox(window, {
		title: ' ',
		type: 'warning',
		buttons: ['Yes', 'No'],
		message: 'Do you want to delete instance "' + ins.name + '"?'
	});
	if (v.response == 0) {
		DataSaver.deleteInstance(ins.hash);
		return true;
	} else {
		return false;
	}
});

ipcMain.on('get-instances', (event) => event.returnValue = DataSaver.instances.instances);

ipcMain.on('get-mod-title-for-ins', (event, name) => {
	event.returnValue = DataSaver.instances.instances.filter(ins => ins.name == name)[0].mods.map(m => DataSaver.mods.title_map[m]);
});

ipcMain.on('get-mods-for-ins', (event, name) => {
	event.returnValue = DataSaver.instances.instances.filter(ins => ins.name == name)[0].mods;
});

ipcMain.on('add-mod-to-ins', (event, id, ins) => {
	DataSaver.instances.instances = DataSaver.instances.instances.map(obj => {
		if (obj.name == ins) {
			obj.mods.push(id);
			return obj;
		}
		return obj;
	});
});

ipcMain.on('remove-mod-from-ins', (event, id, ins) => {
	DataSaver.instances.instances = DataSaver.instances.instances.map(obj => {
		if (obj.name == ins) {
			obj.mods = obj.mods.filter(m => m != id);
			return obj;
		}
		return obj;
	});
});