const dns = require('dns');

dns.lookup('www.google.com', err => {
	return !(err && err.code == 'ENOTFOUND');
});