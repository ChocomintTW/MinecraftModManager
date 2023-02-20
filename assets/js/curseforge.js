const request = require('request');

// https://docs.curseforge.com/
const CurseForge = {
	
	releaseType: {
		all: 0,
		release: 1,
		beta: 2,
		alpha: 3
	},

	/**
	 * @param {string} project 
	 * @returns {string}
	 */
	getBaseUrl: project => 'https://api.curseforge.com/v1/mods/' + project,

	/**
	 * @param {string} project 
	 * @returns 
	 */
	getConnectOption: (url) => {
		return {
			url: url,
			headers: {
				'Accept':'application/json',
				'x-api-key':'$2a$10$tuwS9lLujb.ih6pU9pniEesQRKSUmQKWKnGPb01j5hpj2aSlUYMfS'
			}
		};
	},

	/**
	 * @param {string} project
	 * @returns {Promise<JsonObject>}
	 */
	getProjectJson: function (project) {
		return new Promise((resolve, reject) => {
			request.get(this.getConnectOption(this.getBaseUrl(project)), (error, response, body) => {
				if (response.statusCode == 404) {
					return reject("Mod not found!");
				} else if (response.statusCode == 200) {
					try {
						return resolve(JSON.parse(body));
					}
					catch(err){
						return reject(err);
					}
				}
				return reject(error);
			})
		});
	},

	Loaders: ['Any', 'Forge', 'Cauldron', 'LiteLoader', 'Fabric', 'Quilt'],

	/**
	 * @param {string} project
	 * @returns {Array}
	 */
	getLoaders: async function (project) {
		const json = await this.getProjectJson(project);
		const files = json.data.latestFilesIndexes;
		var loaders = new Set();
		for (const index in files) {
			loaders.add(this.Loaders[files[index].modLoader]);
		}
		return [...loaders]
	},

	/**
	 * @param {string} project
	 * @returns {Promise<Array>}
	 */
	getVersions: function (project) {
		return new Promise((resolve, reject) => {
			request.get(this.getConnectOption(this.getBaseUrl(project) + '/files'), (error, response, body) => {
				if (response.statusCode == 404) {
					return reject("Mod not found!");
				} else if (response.statusCode == 200) {
					try {
						return resolve(JSON.parse(body).data);
					}
					catch(err){
						return reject(err);
					}
				}
				return reject(error);
			})
		});
	},

	/**
	 * @param {string} project 
	 * @param {string} gameVersion 
	 * @param {string} loader 
	 * @param {number} type 
	 */
	latestVersion: async function (project, gameVersion, loader, type = this.releaseType.release) {
		var versions = await this.getVersions(project);
		var valid = versions.filter(v => v.gameVersions.includes(gameVersion) && v.gameVersions.includes(loader))
												.sort((a, b) => this.cpDate(a.date_published, b.date_published));
		return type == this.releaseType.all ? valid[0] : valid.filter(v => v.releaseType == type)[0];
	},

	/**
	 * @param {string} d1
	 * @param {string} d2
	 * @returns {boolean}
	 */
	cpDate: (d1, d2) => new Date(d1) < new Date(d2),

	getVersionFileUrl: function (version) {
		return version.downloadUrl;
	},
};

module.exports = CurseForge;