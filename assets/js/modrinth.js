const request = require('request');

const Modrinth = {
	/**
	 * @param {string} project 
	 * @returns {string}
	 */
	getBaseUrl: project => 'https://api.modrinth.com/v2/project/' + project,

	/**
	 * @param {string} project
	 * @returns {Promise<JsonObject>}
	 */
	getProjectJson: function (project) {
		return new Promise((resolve, reject) => {
			request(this.getBaseUrl(project), (error, response, body) => {
				if (response.statusCode == 404) {
					return reject('Mod not found!');
				} else if (response.statusCode == 200) {
					try{
						const json = JSON.parse(body);
						return resolve(json);
					}
					catch(err){
						return reject(err);
					}
				}
				return reject(error);
			});
		});
	},

	/**
	 * @param {string} project
	 * @returns {Promise<Array>}
	 */
	getLoaders: function (project) {
		return new Promise((resolve, reject) => {
			request(this.getBaseUrl(project) + '/version', (error, response, body) => {
				if (response.statusCode == 404) {
					return reject('Project not found.');
				} else if (response.statusCode == 200) {
					try{
						const json = JSON.parse(body);
						var loaders = new Set();
						for (const index in json) {
							const lo = json[index].loaders;
							for (const j in lo) {
								loaders.add(lo[j].charAt(0).toUpperCase() + lo[j].slice(1));
							}
						}
						return resolve([...loaders]);
					}
					catch(err){
						return reject(err);
					}
				}
				return reject(error);
			});
		});
	},

	/**
	 * @param {string} project
	 * @returns {Promise<Array>}
	 */
	getVersions: function (project) {
		return new Promise((resolve, reject) => {
			request(this.getBaseUrl(project) + '/version', (error, response, body) => {
				if (response.statusCode == 404) {
					return reject('Project not found.');
				} else if (response.statusCode == 200) {
					try{
						return resolve(JSON.parse(body));
					}
					catch(err){
						return reject(err);
					}
				}
				return reject(error);
			});
		});
	},

	/**
	 * @param {string} project 
	 * @param {string} gameVersion 
	 * @param {string} loader 
	 */
	latestVersion: async function (project, gameVersion, loader, onlyRelease = true) {
		var versions = await this.getVersions(project);
		var valid = versions.filter(v => v.game_versions.includes(gameVersion) && v.loaders.includes(loader.toLowerCase()))
												.sort((a, b) => this.cpDate(a.date_published, b.date_published));
		return onlyRelease ? valid.filter(v => v.version_type == 'release')[0] : valid[0];
	},

	/**
	 * @param {string} d1
	 * @param {string} d2
	 * @returns {boolean}
	 */
	cpDate: (d1, d2) => new Date(d1) < new Date(d2),

	/**
	 * @param {string} id 
	 * @returns {Promise<string>}
	 */
	getVersionFileUrl: function (id) {
		return new Promise((resolve, reject) => {
			request('https://api.modrinth.com/v2/version/' + id, (error, response, body) => {
				if (response.statusCode == 404) {
					return reject("Project not found.");
				} else if (response.statusCode == 200) {
					try{
						return resolve(JSON.parse(body).files[0].url);
					}
					catch(err){
						return reject(err);
					}
				}
				return reject(error);
			});
		});
	}
};

module.exports = Modrinth;