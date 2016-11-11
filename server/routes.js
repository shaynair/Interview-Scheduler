// Configures routes.
const c = require("./constants");

const PAGES = {
	'/': {
		name: 'index',
		title: "Home"
	},
	'/404': {
		name: '404',
		title: 'Error'
	},
}

module.exports = {
	configure: function (app, main) {
		// Standard pages
		for (let r in PAGES) {
			app.get(r, (req, res) => {
				if (!req.body) {
					return res.sendStatus(400); // Error
				} else {
					this.generateData(req, main, r, (data) => {
						if (data != null) {
							res.render(PAGES[r].name, data);
						}
					});
				}
			});
		}

		// Error handler
		app.use((req, res, next) => {
			res.status(404);

			// respond with html page
			if (req.accepts('html')) {
				this.generateData(req, main, null, (data) => {
					res.render('404', data);
				});
				return;
			}

			// respond with json
			if (req.accepts('json')) {
				res.send({
					error: 'Not found'
				});
				return;
			}

			// default to plain-text. send()
			res.type('txt').send('Not found');
		});
	},

	// Generates data for use in EJS template. 
	generateData: function (req, main, r, cb) {
		// By default, fields are null
		let ret = {
			title: "Error",
			data: {},
		};
		if (r) {
			ret.title = PAGES[r].title;
		}
		cb(ret);
	},
	
	// Configures socket routes
	socket: function (socket, io, main) {
		socket.on("add", (add) => {
			main.db.add(add.type, add.text, add.link, (id) => {
				add.id = id;
				io.emit("add", add);
				socket.emit("success");
			});
		});
		
		socket.on("edit", (add) => {
			main.db.edit(add.type, add.id, add.text, add.link);
			
			io.emit("edit", add);
			socket.emit("success");
		});
		
		socket.on("remove", (add) => {
			main.db.remove(add.type, add.id);
			
			io.emit("remove", add);
			socket.emit("success");
		});
		socket.on("set", (add) => {
			main.db.set(add);
			
			io.emit("set", add);
			socket.emit("success");
		});
		
		var reset = () => {
			main.db.getAllData((data) => {
				socket.emit("change", data);
				socket.emit("success");
			});
		};

		reset();

		socket.on("change", reset);
	}
}