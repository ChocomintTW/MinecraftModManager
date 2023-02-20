const fs = require('fs');
const dns = require('dns');
const request = require('request');

const Network = {
	/**
	 * @returns {boolean}
	 */
	checkOnline: async () => {
		const offline = false;
		const online = true;
		return new Promise((resolve, reject) => {
			dns.lookup('www.google.com', (err) => {
				if (err && err.code == 'ENOTFOUND') {
					resolve(offline);
				} else {
					resolve(online);
				}
			});
		});
	},

	/**
	 * @callback progressCallback
	 * @param {number} progress between 0 and 1
	 */

	/**
	 * @param {string} fromUrl 
	 * @param {fs.PathLike} toPath 
	 * @param {progressCallback} callback
	 */
	download: (fromUrl, toPath, callback) => {
		var received_bytes = 0;
		var total_bytes = 0;

		request.get(fromUrl)
			.on('response', data => {
				total_bytes = parseInt(data.headers['content-length']);
			})
			.on('data', d => {
				received_bytes += d.length;
				callback(received_bytes / total_bytes);
			})
			.pipe(fs.createWriteStream(toPath));
	},
};

module.exports = Network;