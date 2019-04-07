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
	  $ npx add-quik-video <videofile> <videofile>…

	Examples
	  $ npx add-quik-video videos/IMG_1337.mp4 *.mov
`, {
	flags: {}
});

async function isAlreadyInserted(db, filename) {
	const rows = await db.all('select * from media where filename=?', filename)
	return rows.length >= 1
}

async function insertMedia(db, absoluteFilename) {
	const exifTags = await exiftool.read(absoluteFilename)

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
		uuid, absoluteFilename, 'video', 'video', exifTags.MediaCreateDate.toISOString(),
		new Date().toISOString(), fileSizeInBytes, 'GoPro HERO7 Black Edition', exifTags.ImageWidth, exifTags.ImageHeight,
		Math.trunc(exifTags.Duration), 'HD7.01.01.70.00', 'LAJ123456789012', 0, 0,
		0, 0, new Date().toISOString(), 0
	)
}

async function main(filenames) {
	filenames.filter(filename => !fs.existsSync(filename))
		.forEach(filename => {
				console.error('file not found: ', filename)
				process.exit(3)

			}
		)
	let db = null;
	try {
		const dbFile = path.join(platformFolders.getDataHome(), 'com.GoPro.goproapp.GoProMediaService/Databases/media.db')
		db = await sqlite.open(dbFile, {Promise})

		const absoluteFilenames = filenames.map(filename => path.resolve(filename))
		for (let i = 0; i < absoluteFilenames.length; i++) {
			const filename = absoluteFilenames[i]
			if (await isAlreadyInserted(db, filename)) {
				console.warn(`File ${filename} is already in media database`)
			} else {
				await insertMedia(db, filename);
				console.log(`Added ${filename}`)
			}
		}
	} finally {
		if (db) {
			await db.close()
		}
		await exiftool.end()
	}
}

if (typeof require != 'undefined' && require.main == module) {
	if (!cli.input[0]) {
		cli.showHelp()
	}
	main(cli.input);
}
