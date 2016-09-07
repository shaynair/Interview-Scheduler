// This file handles the database queries.
const async = require("async");
const mongodb = require('mongodb');
const c = require("./constants");

module.exports = {
	run: function(cb) {
		mongodb.MongoClient.connect(c.DATABASE_URL, (err, db) => {
			c.logError(err);
			cb(db, (err) => {
				c.logError(err);
				
				db.close();
			});
		});
	},
	
	add: function(type, text, link, callback) {
		this.run((db, cb) => {
			let collection = db.collection(type);
			let ob = {"text": text};
			if (link) {
				ob.link = link;
			}
			collection.insertOne(ob, (err, res) => {
				callback(ob._id);
				cb(err);
				
				this.edit(type, ob._id, text, link);
			});
		});
	},
	
	edit: function(type, id, text, link) {
		this.run((db, cb) => {
			let collection = db.collection(type);
			collection.updateOne({_id: new mongodb.ObjectID(id)}, {$set: {"text": text, "link": link}}, cb);
		});
	},
	
	remove: function(type, id) {
		this.run((db, cb) => {
			let collection = db.collection(type);
			collection.deleteOne({_id: new mongodb.ObjectID(id)}, (err, res) => {
				c.logError(err);
				
				let data = db.collection("data");
				let ob = {};
				ob[type] = id;
				data.deleteMany(ob, cb);
			});
		});
	},
	
	set: function(add) {
		this.run((db, cb) => {
			let collection = db.collection("data");
			collection.deleteMany({table: add.table, col: add.col, row: add.row}, (err, res) => {
				if (add.entry) {
					c.logError(err);
					collection.insertOne(add, cb);
				} else {
					cb(err);
				}
			});
		});
	},
	
	getAllData: function(callback) {
		this.run((db, cb) => {
			let tasks = {};
			let calls = ["table", "row", "col", "entry"];
			
			for (let type of calls) {
				tasks[type] = (cback) => {
					let collection = db.collection(type);
					collection.find({}).toArray((err, res) => {
						c.logError(err);
						cback(null, res);
					});
				};
			}
			
			async.parallel(tasks, (err, res) => {
				c.logError(err);
				let ret = {};
				for (let type in res) {
					if (res.hasOwnProperty(type)) {
						ret[type] = {};
						for (let ob of res[type]) {
							ret[type][ob._id] = {text: ob.text};
							if (ob.link) {
								ret[type][ob._id].link = ob.link;
							}
						}
					}
				}
				
				let collection = db.collection("data");
				collection.find({}).toArray((err, result) => {
					ret.data = {};
					for (let set of result) {
						if (!set.entry) {
							continue;
						}
						ret.data[set.table + "-" + set.col + "-" + set.row] = set.entry;
					}
					callback(ret);
					cb(err);
				});

			});
		});
	}
	
}