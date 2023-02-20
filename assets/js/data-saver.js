const fs = require('fs');

const DataSaver = {
	// Mods
	mods: {
		"title_map": {},
		"mods": []
	},
	
	loadModsFromFile: function () {
		if (fs.existsSync('./data/mods.json')) {
			var str = fs.readFileSync('./data/mods.json').toString();
			if (str != '') this.mods = JSON.parse(str);
		}
	},

	saveModsToFile: function () {
		if (!fs.existsSync('./data')) {
			fs.mkdir('./data', err => {});
		}
		fs.writeFile('./data/mods.json', JSON.stringify(this.mods, null, '\t'), () => {});
	},

	/**
	 * @param {string} id
	 * @returns {string}
	 */
	modTitle: function (id) {
		return this.mods.title_map[id];
	},

	/**
	 * @param {string} platform 
	 * @param {string} id 
	 * @param {Array} loaders 
	 * @param {JsonObject} mod 
	 */
	addMod: function (platform, id, loaders, mod, title) {
		this.mods.title_map[id] = title;
		this.mods.mods.push({
			"id": id,
			"loaders": loaders,
			"platform": platform,
			"data": mod
		});
	},

	deleteMod: function (id) {
		delete this.mods.title_map[id];
		this.mods.mods = this.mods.mods.filter(mod => mod.id != id);

		this.instances.instances.forEach(ins => ins.mods = ins.mods.filter(m => m != id))
	},

	// Instances
	instances: {
		"instances": []
	},
	
	loadInstancesFromFile: function () {
		if (fs.existsSync('./data/instances.json')) {
			var str = fs.readFileSync('./data/instances.json').toString();
			if (str != '') this.instances = JSON.parse(str);
		}
	},

	saveInstancesToFile: function () {
		if (!fs.existsSync('./data')) {
			fs.mkdir('./data', err => {});
		}
		fs.writeFile('./data/instances.json', JSON.stringify(this.instances, null, '\t'), () => {});
	},

	deleteInstance: function (hash) {
		this.instances.instances = this.instances.instances.filter(ins => ins.hash != hash);
	},
}

module.exports = DataSaver;