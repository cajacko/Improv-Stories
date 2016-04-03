var db = require('../models/db');

exports.create = function(codename, authors, entryTime, visibility, cb) {
	db.query('INSERT INTO stories (codename, entry_time, visibility) VALUES (?, ?, ?)', [codename, entryTime, visibility], function(err, result) {

		for (i = 0; i < authors.length; i++) { 
			db.query('INSERT INTO story_authors (story_id, user_id) VALUES (?, ?)', [result.insertId, authors[i]]);
		}

		cb(result.insertId);
	});
}

exports.getUserStories = function(userId, cb) {
	db.query('SELECT stories.codename, stories.id FROM stories INNER JOIN story_authors ON story_authors.story_id = stories.id WHERE story_authors.user_id = "' + userId + '"', function(err, stories, fields) {
		cb(err, stories);
	});
}




