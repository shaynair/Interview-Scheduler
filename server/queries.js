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
	
	add: function(type, text, callback) {
		this.run((db, cb) => {
			let collection = db.collection(type);
			let ob = {"text": text};
			collection.insertOne(ob, (err, res) => {
				c.logError(err);
				
				callback(ob._id);
				cb();
				
				this.edit(type, ob._id, text);
			});
		});
	},
	
	edit: function(type, id, text) {
		this.run((db, cb) => {
			let collection = db.collection(type);
			collection.updateOne({_id: new mongodb.ObjectID(id)}, {$set: {"text": text}}, cb);
		});
	},
	
	remove: function(type, id) {
		this.run((db, cb) => {
			let collection = db.collection(type);
			collection.deleteOne({_id: new mongodb.ObjectID(id)}, cb);
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
							ret[type][ob._id] = ob.text;
						}
					}
				}
				callback(ret);
				cb();
			});
		});
	}
	
}