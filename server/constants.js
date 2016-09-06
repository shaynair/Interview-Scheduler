// This file defines global constants for our app.

// Postgres information
exports.DATABASE_URL = "mongodb://aoa:aoa@ds019816.mlab.com:19816/interview-scheduler";

// Sessions
exports.COOKIE_SECRET = 'interview-scheduler';

exports.logError = (err) => {
	if (err) {
		console.log(err);
	}
}

exports.logInfo = (err) => {
	if (err) {
		console.log(err);
	}
}