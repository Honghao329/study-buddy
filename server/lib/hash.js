const crypto = require('crypto');

function hashPwd(pwd) {
	return crypto.createHash('sha256').update(pwd + '_study_buddy').digest('hex');
}

module.exports = { hashPwd };
