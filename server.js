// This file handles the main running of the server.
// Do all requires
const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const csrf = require('csurf');
const socketio = require('socket.io');

// File requires
const c = require('./server/constants');
const routes = require('./server/routes');
const queries = require('./server/queries');

// Server config
const app = express();
app.set('port', process.env.PORT || 80);

// Enable GZIP compression
app.use(compression());

// Enable prevention of clickjacking and other headers
// Also set Content-Security-Policy
app.use(helmet({
	contentSecurityPolicy: {
		// Specify directives as normal. 
		directives: {
			defaultSrc: ["'self'"],
			childSrc: ["'self'"],
			frameAncestors: ["'self'"],
			scriptSrc: ["'self'", "'unsafe-inline'", 
				"https://cdnjs.cloudflare.com"],
			styleSrc: ["'self'", "'unsafe-inline'", 
				"https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
			fontSrc: ["'self'", "'unsafe-inline'", "https://fonts.gstatic.com",
				"https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
			imgSrc: ["'self'", 'data:'],
			connectSrc: ["'self'", "blob:", 'wss:', 'ws:', 'websocket.domain'],
			objectSrc: [],
			sandbox: ["allow-forms", "allow-scripts", "allow-same-origin",
				"allow-top-navigation", "allow-modals"
			]
		},
		reportOnly: false,
		setAllHeaders: false,
		disableAndroid: false
	}
}));

// Static files
app.use(express.static(__dirname + '/public', { maxAge: '14d' }));

// Template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
//app.set('view cache', 'true');

// Enable body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));

// CSRF protection for POST
app.use(cookieParser(c.COOKIE_SECRET));
app.use(csrf({
	cookie: true
}));

// Exports for other files
module.exports = {
	// Runs server
	run: () => {
		// Configure routes
		routes.configure(app, module.exports);

		// Run the server
		let server = app.listen(app.get('port'), () => {
			console.log('Server is running on port', app.get('port'));
		});
		let io = socketio.listen(server);
		
		io.on("connection", (s) => routes.socket(s, io, module.exports));
	},
	
	// Express
	"app": app,
	
	"db": queries
};

module.exports.run();