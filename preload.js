const { ipcRenderer, shell } = require('electron');

// https://ithelp.ithome.com.tw/articles/10235110?sc=iThomeR
window.addEventListener('DOMContentLoaded', async () => {

	const replaceText = (selector, text) => {
		const element = document.getElementById(selector)
		if (element) element.innerText = text
	}

	for (const type of ['chrome', 'node', 'electron']) {
		replaceText(`${type}-version`, process.versions[type])
	}

	document.getElementById('add_m').addEventListener('click', event => {
		ipcRenderer.invoke('modrinth_add').then(obj => {
			var event;
			if (obj.msg == 'Mod not found!') {
				event = new CustomEvent('mod-not-found', {'detail': { msg: obj.msg }});
			} else if (obj.modData) {
				const mod = {
					"id": obj.id,
					"loaders": obj.loaders,
					"platform": "Modrinth",
					"data": obj.modData
				}
				appendModBlock(mod);
				event = new CustomEvent('add-mod-success', {'detail': { msg: obj.msg }});
			} else {
				event = new CustomEvent('add-mod-exist', {'detail': { msg: obj.msg }});
			}
			document.dispatchEvent(event);
		});
	});

	document.getElementById('add_c').addEventListener('click', event => {
		ipcRenderer.invoke('curseforge_add').then(obj => {
			var event;
			if (obj.msg == 'Mod not found!') {
				event = new CustomEvent('mod-not-found', {'detail': { msg: obj.msg }});
			} else if (obj.modData) {
				const mod = {
					"id": obj.id,
					"loaders": obj.loaders,
					"platform": "CurseForge",
					"data": obj.modData
				}
				appendModBlock(mod);
				event = new CustomEvent('add-mod-success', {'detail': { msg: obj.msg }});
			} else if (obj.id) {
				event = new CustomEvent('add-mod-exist', {'detail': { msg: obj.msg }});
			}
			document.dispatchEvent(event);
		});
	});

	// document.getElementById('import').addEventListener('click', event => {});

	document.addEventListener('mouseover', event => {
		const element = document.elementFromPoint(event.clientX, event.clientY);

		var tooltip = document.getElementById('mod-open-ext');
		tooltip.style.visibility = element.classList.contains('mod-image') ? 'visible' : 'hidden';

		var tooltip2 = document.getElementById('view-ins-mods');
		tooltip2.style.visibility = ['instance-title', 'instance-info', 'ins-text'].some(e => element.classList.contains(e)) ? 'visible' : 'hidden';
	});

	var search = document.getElementById('search');
	var versions = document.getElementById('versions');

	search.addEventListener('input', event => filter(event.target.value, versions.value));
	versions.addEventListener('change', event => filter(search.value, event.target.value));

	/**
	 * @param {string} search 
	 * @param {string} version 
	 */
	function filter(search, version) {
		document.querySelectorAll('.mod-block').forEach(element => {
			var ual = ''; // upper case & lower case
			for (var i in search) {
				ch = search[i];
				if      (ch >= 'a' && ch <= 'z') ual += '(' + ch + '|' + ch.toUpperCase() + ')';
				else if (ch >= 'A' && ch <= 'Z') ual += '(' + ch + '|' + ch.toLowerCase() + ')';
				else ual += ch;
			}
			const condition = element.children[1].children[0].innerText.match(ual);

			const opt = condition ? ['show', 'hide'] : ['hide', 'show'];
			element.classList.add(opt[0]);
			element.classList.remove(opt[1]);
		});
	}

	function configureMode() {
		document.querySelectorAll('.mod-block').forEach(element => {
			var deleteIcon = element.children[2].children[2];
			deleteIcon.classList.add('show');
			deleteIcon.classList.remove('hide');
			element.style.opacity = '100%';
			hideAdd(element);
			hideMinus(element);
		});
	}

	document.getElementById('instances').addEventListener('change', event => {
		if (event.target.value == 'Configure Mods') {
			configureMode();
		} else {
			const mods = ipcRenderer.sendSync('get-mods-for-ins', event.target.value).map(o => 'mod-' + o);
			document.querySelectorAll('.mod-block').forEach(element => {
				var deleteIcon = element.children[2].children[2];
				deleteIcon.classList.add('hide');
				deleteIcon.classList.remove('show');
				if (mods.includes(element.id)) {
					element.style.opacity = '70%';
					showMinus(element);
					hideAdd(element);
				} else {
					element.style.opacity = '100%';
					showAdd(element);
					hideMinus(element);
				}
			});
		}
	});
	
	document.getElementById('change-instance').addEventListener('click', event => {
		configureMode();
		changeToInstance();
	});
	document.getElementById('change-mod').addEventListener('click', event => {
		updateInstanceSelection(ipcRenderer.sendSync('get-instances'));
		changeToMod();
	});

	document.getElementById('add-instance').addEventListener('click', event => {
		changeToInstanceSettings();
		setMode('add');
	});

	document.getElementById('save-instance').addEventListener('click', event => {
		const instanceList = ipcRenderer.sendSync('get-instances');

		const name = document.getElementById('instance-name').value;
		const instance = JSON.parse(JSON.stringify({
			hash: hash(name),
			name: name,
			version: document.getElementById('minecraft-versions').value,
			loader: document.getElementById('loaders').value,
			mods: []
		}));

		var list = ['Instance Name', 'Game Version', 'Mod Loader'];
		var errors = [instance.name == '', instance.version == 'Select Version', instance.loader == 'Select Loader'];

		if (instanceList.filter(ins => ins.name == name).length != 0) {
			document.dispatchEvent(new CustomEvent('add-instance-error', {
				'detail': { msg: '"' + name + '" already exists.' }
			}));
		} else if (errors.some(Boolean)) {
			document.dispatchEvent(new CustomEvent('add-instance-error', {
				'detail': { msg: enumeration(list.filter((_, index) => errors[index])) + ' should not be empty.' }
			}));
		} else {
			const mode = ipcRenderer.sendSync('save-instance', instance, getMode(), getNowEdit());
			if (mode == 'add') {
				appendInstanceBlock(instance);
				document.dispatchEvent(new CustomEvent('add-instance-success', {'detail': {
					msg: 'Add "' + instance.name + '" successfully!'
				}}));
			} else if (mode == 'edit') {
				updateNowEditInstance(instance);
				document.dispatchEvent(new CustomEvent('add-instance-success', {'detail': {
					msg: 'Edit successfully!'
				}}));
			}
			setMode('standby');
			setNowEdit('');
			changeToInstance();
		}
	});

	document.getElementById('cancel-instance').addEventListener('click', event => {
		setMode('standby');
		setNowEdit('');
		changeToInstance();
	});

	/**
	 * @param {string[]} list
	 * @returns {string}
	 */
	function enumeration(list) {
		var s = '';
		var len = list.length;
		if (len >= 2) {
			for (var i = 0; i < len - 2; i++) {
				s += list[i] + ', ';
			}
		}
		s += list[len - 2] + ' and ' + list[len - 1];
		return s;
	}
})

ipcRenderer.on('return-mvl', (event, list) => {
	document.getElementById('versions').insertAdjacentHTML("beforeend", /*html*/`
		<option value="Version: All">Version: All</option>
	`);
	list.forEach(version => {
		var opt = /*html*/`<option value=${version}>${version}</option>`;
		document.getElementById('versions').insertAdjacentHTML("beforeend", opt);
		document.getElementById('minecraft-versions').insertAdjacentHTML("beforeend", opt);
	});
});

ipcRenderer.on('mod-load-complete', (event, list) => {
	list.forEach(mod => appendModBlock(mod));
});

ipcRenderer.on('instance-load-complete', (event, list) => {
	list.forEach(ins => appendInstanceBlock(ins));
	updateInstanceSelection(list);
});

function updateInstanceSelection(instances) {
	var ins = document.getElementById('instances');
	ins.innerHTML = '';
	ins.insertAdjacentHTML("beforeend", /*html*/`<option>Configure Mods</option>`);
	for (var i in instances) {
		ins.insertAdjacentHTML("beforeend", /*html*/`<option value=${instances[i].name}>${instances[i].name}</option>`);
	}
}

/**
 * @param {JsonObject} mod 
 */
function appendModBlock(mod) {
	var div = document.createElement('div');
	div.setAttribute('class', 'mod-block show');
	div.setAttribute('id', 'mod-' + mod.id);

	var opt = (selectedInstance() == 'Configure Mods' || selectedInstance() == '' ? ['show', 'hide'] : ['hide', 'show'])

	div.insertAdjacentHTML("beforeend", /*html*/`
		<!-- icon -->
		<div style="margin: 5px; height: auto;">
			<img src=${ModJson.getIconUrl(mod)} class="mod-image" id=${'link-' + mod.id}>
		</div>
		
		<!-- text -->
		<div style="margin: 5px; height: auto; flex-grow: 1;">
			<h3 class="mod-title">${ModJson.getModTitle(mod)}</h3>
			<p class="mod-info">Loaders: ${arrayToString(mod.loaders)}</p>
		</div>

		<!-- act -->
		<div style="margin: 5px; height: auto;" class="mod-block-right">
			<div class="icon-div hide">
				<div class="icon-box" id=${'remove-' + mod.id}><i class="fa-solid fa-square-minus icon"></i></div>
			</div>
			<div class="icon-div ${opt[1]}">
				<div class="icon-box" id=${'add-' + mod.id}><i class="fa-solid fa-square-plus icon"></i></div>
			</div>
			<div class="icon-div ${opt[0]}">
				<div class="icon-box" id=${'delete-' + mod.id}><i class="fa-solid fa-trash icon"></i></div>
			</div>
		</div>
	`);

	document.getElementById('mod-list').appendChild(div);

	document.getElementById('link-' + mod.id).addEventListener('click', e => ipcRenderer.send('open-ext-clicked', ModJson.getModPage(mod)));
	document.getElementById('delete-' + mod.id).addEventListener('click', e => {
		ipcRenderer.invoke('delete-mod', mod.id, ModJson.getModTitle(mod)).then((confirm) => {
			if (confirm) {
				document.getElementById('mod-' + mod.id).remove();
				document.dispatchEvent(new CustomEvent('delete-mod', {'detail': { msg: 'Delete ' + ModJson.getModTitle(mod) + ' successfully!' }}));
			}
		});
	});

	document.getElementById('add-' + mod.id).addEventListener('click', e => {
		ipcRenderer.send('add-mod-to-ins', mod.id, selectedInstance());
		const modBlock = document.getElementById('mod-' + mod.id);
		changeToMinus(modBlock);
	});

	document.getElementById('remove-' + mod.id).addEventListener('click', e => {
		ipcRenderer.send('remove-mod-from-ins', mod.id, selectedInstance());
		const modBlock = document.getElementById('mod-' + mod.id);
		changeToAdd(modBlock);
	});

	appendSimpleModBlock(mod);
}

function selectedInstance() {
	return document.getElementById('instances').value;
}

function changeToAdd(modBlock) {
	modBlock.style.opacity = '100%';
	showAdd(modBlock);
	hideMinus(modBlock);
}

function changeToMinus(modBlock) {
	modBlock.style.opacity = '70%';
	showMinus(modBlock);
	hideAdd(modBlock);
}

function showAdd(modBlock) {
	var icon_add = modBlock.children[2].children[1];
	icon_add.classList.add('show');
	icon_add.classList.remove('hide');
}

function showMinus(modBlock) {
	var icon_minus = modBlock.children[2].children[0];
	icon_minus.classList.add('show');
	icon_minus.classList.remove('hide');
}

function hideAdd(modBlock) {
	var icon_add = modBlock.children[2].children[1];
	icon_add.classList.add('hide');
	icon_add.classList.remove('show');
}

function hideMinus(modBlock) {
	var icon_minus = modBlock.children[2].children[0];
	icon_minus.classList.add('hide');
	icon_minus.classList.remove('show');
}

/**
 * @param {JsonObject} instance
 */
function appendInstanceBlock(instance) {
	var div = document.createElement('div');
	div.setAttribute('class', 'instance-block show');
	div.setAttribute('id', 'instance-' + instance.hash);

	div.insertAdjacentHTML("beforeend", getInstanceBlockInner(instance));

	document.getElementById('instance-list').appendChild(div);

	bindInstanceEvent(instance);
}

function getMode() {
	return document.getElementById('instance-settings').getAttribute('mode');
}

function setNowEdit(hash) {
	document.getElementById('instance-settings').setAttribute('nowEdit', hash);
}

function getNowEdit() {
	return document.getElementById('instance-settings').getAttribute('nowEdit');
}

/**
 * @param {JsonObject} instance
 */
function updateNowEditInstance(instance) {
	document.getElementById('instance-' + getNowEdit()).innerHTML = getInstanceBlockInner(instance);
	document.getElementById('instance-' + getNowEdit()).id = 'instance-' + instance.hash;
	bindInstanceEvent(instance);
}

/**
 * @param {JsonObject} instance
 */
function getInstanceBlockInner(instance) {
	return /*html*/`
		<div id=${'view-mods-' + instance.hash} class="ins-text" style="margin: 0px 5px; height: auto; flex-grow: 1;">
		<h3 class="instance-title">${instance.name}</h3>
		<p class="instance-info">${instance.version}, ${instance.loader}</p>
		</div>
		<div class="icon-div show">
			<div class="icon-box" id=${'update-' + instance.hash}><i class="fa-solid fa-rotate icon"></i></div>
		</div>
		<!-- <div class="icon-div show">
			<div class="icon-box" id=${'download-' + instance.hash}><i class="fa-solid fa-download icon"></i></div>
		</div> -->
		<div class="icon-div show">
			<div class="icon-box" id=${'edit-' + instance.hash}><i class="fa-solid fa-pen-to-square icon"></i></div>
		</div>
		<div class="icon-div show">
			<div class="icon-box" id=${'delete-' + instance.hash}><i class="fa-solid fa-trash icon"></i></div>
		</div>
	`;
}

/**
 * @param {JsonObject} instance
 */
function bindInstanceEvent(instance) {
	document.getElementById('update-' + instance.hash).addEventListener('click', e => {
	});

	// document.getElementById('download-' + instance.hash).addEventListener('click', e => {
	// });

	document.getElementById('edit-' + instance.hash).addEventListener('click', e => {
		document.getElementById('instance-name').value      = instance.name;
		document.getElementById('minecraft-versions').value = instance.version;
		document.getElementById('loaders').value            = instance.loader;
		changeToInstanceSettings();
		setMode('edit');
		setNowEdit(instance.hash);
	});

	document.getElementById('delete-' + instance.hash).addEventListener('click', e => {
		ipcRenderer.invoke('delete-instance', instance).then((confirm) => {
			if (confirm) {
				document.getElementById('instance-' + instance.hash).remove();
				document.dispatchEvent(new CustomEvent('delete-instance', {'detail': { msg: 'Delete "' + instance.name + '" successfully!' }}));
			}
		});
	});

	const view = 'view-mods-' + instance.hash;
	document.getElementById(view).addEventListener('click', e => {
		var has = document.getElementById(view).parentElement.hasAttribute('selected');
		document.querySelectorAll('.ins-text').forEach(element => {
			if (element.id == view && !has) element.parentElement.setAttribute('selected', '');
			else element.parentElement.removeAttribute('selected');
		});

		if (has) { // no select
			document.querySelectorAll('.mod-block-for-showing').forEach(element => element.setAttribute('vis', false));
		} else {
			const title = ipcRenderer.sendSync('get-mod-title-for-ins', instance.name);
			document.querySelectorAll('.mod-block-for-showing').forEach(element => {
				element.setAttribute('vis', title.includes(element.children[1].children[0].innerText));
			});
		}
	});
}

/**
 * @param {JsonObject} mod 
 */
function appendSimpleModBlock(mod) {
	var div = document.createElement('div');
	div.setAttribute('class', 'mod-block-for-showing');
	div.setAttribute('vis', false);
	div.setAttribute('id', 'showing-' + mod.id);

	div.insertAdjacentHTML("beforeend", /*html*/`
		<!-- icon -->
		<div style="margin: 5px; height: auto;">
			<img src=${ModJson.getIconUrl(mod)} class="mod-image" style="cursor: initial;" id=${'link-' + mod.id}>
		</div>
		
		<!-- text -->
		<div style="margin: 5px; height: auto; flex-grow: 1; display: flex; align-items: center;">
			<h3 class="mod-title">${ModJson.getModTitle(mod)}</h3>
		</div>
	`);

	document.getElementById('instance-mod-list').append(div);
}

/**
 * @param {string} mode 
 */
function setMode(mode) {
	document.getElementById('instance-settings').setAttribute('mode', mode);
}

/**
 * @param {HTMLElement} show 
 */
function showAndHideOtherMain(show) {
	Array.from(document.getElementsByClassName('main-container')).forEach(e => {
		e.classList.remove('show');
		e.classList.add('hide');
	});
	show.classList.remove('hide');
	show.classList.add('show');
}

function changeToInstanceSettings() { showAndHideOtherMain(document.getElementById('instance-settings')); }
function changeToInstance() { showAndHideOtherMain(document.getElementById('instance')); }
function changeToMod() { showAndHideOtherMain(document.getElementById('mod')); }

function arrayToString(array) {
	var str = '';
	for (var i in array) {
		str += array[i] + ', ';
	}
	return str.slice(0, -2);
}

function hash(string) {
	var hash = 0;
	if (string.length == 0) return hash;

	for (i = 0; i < string.length; i++) {
			char = string.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash &= hash;
	}

	return hash.toString(16);
}

const ModJson = {
	/**
	 * @param {JsonObject} modJson 
	 */
	getIconUrl: (modJson) => {
		if (modJson.platform == 'Modrinth') return modJson.data.icon_url;
		if (modJson.platform == 'CurseForge') return modJson.data.logo.url;
	},

	/**
	 * @param {JsonObject} modJson 
	 */
	getModPage: (modJson) => {
		if (modJson.platform == 'Modrinth') return 'https://modrinth.com/mod/' + modJson.id;
		if (modJson.platform == 'CurseForge') return 'https://www.curseforge.com/minecraft/mc-mods/' + modJson.data.slug;
	},

	/**
	 * @param {JsonObject} modJson 
	 */
	getModTitle: (modJson) => {
		if (modJson.platform == 'Modrinth') return modJson.data.title;
		if (modJson.platform == 'CurseForge') return modJson.data.name;
	}
}