'use strict';
const sqlite = require('sqlite');
const meow = require('meow');
const uuidv1 = require('uuid/v1');
const path = require('path');
const fs = require('fs');
const exiftool = require('exiftool-vendored').exiftool
const platformFolders = require('platform-folders');

const cli = meow(`
	Usage
	  $ npx add-quik-video <input>

	Examples
	  $ npx add-quik-video videos/IMG_1337.mp4
`, {
	flags: {}
});

async function assertNotAlreadyInserted(db, filename) {
	const rows = await db.all('select * from media where filename=?', filename)
	if (rows.length >= 1) {
		console.log('File is already in media database')
		process.exit(1)
	}
}

async function insertMedia(db, absoluteFilename) {
	const tags = await exiftool.read(absoluteFilename)
	let uuid = uuidv1().replace(/[-]/g, '');
	const fileSizeInBytes = fs.statSync(absoluteFilename).size

	return db.run(`INSERT INTO media (
                      gumi, filename, type, subtype, creation_date, 
                      import_date, size, camera_model, width, height, 
                      duration, camera_firmware_version, camera_lens_model, managed_folder, watch_folder,
                      hilight_tags, state, updated_at, revision_number
                  )
                  VALUES (
                  ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?,
                  ?, ?, ?, ?, ?,
                  ?, ?, ?, ?); `,
		uuid, absoluteFilename, 'video', 'video', tags.MediaCreateDate.toISOString(),
		new Date().toISOString(), fileSizeInBytes, 'GoPro HERO7 Black Edition', tags.ImageWidth, tags.ImageHeight,
		Math.trunc(tags.Duration), 'HD7.01.01.70.00', 'LAJ123456789012', 0, 0,
		0, 0, new Date().toISOString(), 0
	)
}

async function main(filename) {
	if (!fs.existsSync(filename)) {
		console.error('file not found: ', filename)
		process.exit(3)
	}
	let db = null;
	try {
		const dbFile = path.join(platformFolders.getDataHome(), 'com.GoPro.goproapp.GoProMediaService/Databases/media.db')
		db = await sqlite.open(dbFile, {Promise})
		db.configure('busyTimeout', 5)
		db.on('trace', t => console.log(t))
		db.on('error', t => console.error(t))
		db.on('profile', t => console.error(t))
		let absoluteFilename = path.resolve(filename)
		await assertNotAlreadyInserted(db, absoluteFilename);

		await insertMedia(db, absoluteFilename);
	} finally {
		await db.close()
	}
}

if (typeof require != 'undefined' && require.main == module) {
	if (!cli.input[0]) {
		cli.showHelp()
	}
	main(cli.input[0]);
}
