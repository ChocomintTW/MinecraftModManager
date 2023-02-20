const request = require('request');
const CurseForge = require('./curseforge');

const Minecraft = {
	versions: [],

	initMinecraftVersionsList: function () {
		return new Promise((resolve, reject) => {
			request.get(CurseForge.getConnectOption('https://api.curseforge.com/v1/minecraft/version'), (error, response, body) => {
				if (response.statusCode == 404) {
					return reject("Project not found.");
				} else if (response.statusCode == 200) {
					try {
						const json = JSON.parse(body);
						json['data'].forEach((v, index) => {
							this.versions.push(v['versionString']);
						});
						return resolve(this.versions);
					}
					catch(err){
						return reject(err);
					}
				}
				return reject(error);
			})
		});
	}
};

module.exports = Minecraft;