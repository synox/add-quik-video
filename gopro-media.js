const path = require('path')
const fs = require('fs')
const sqlite = require('sqlite')
const uuidv1 = require('uuid/v1')
const platformFolders = require('platform-folders')

class GoproMedia {
	constructor() {
		this.db = null
	}

	async init() {
		const dbFile = path.join(
			platformFolders.getDataHome(),
			'com.GoPro.goproapp.GoProMediaService/Databases/media.db'
		)

		this.db = await sqlite.open(dbFile, {Promise})
	}

	async end() {
		if (this.db) {
			await this.db.close()
		}
	}

	async add(mediaFile) {
		const uuid = uuidv1().replace(/[-]/g, '')
		const fileSizeInBytes = fs.statSync(mediaFile.filename).size

		return this.db.run(
			`INSERT INTO media (
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
			uuid,
			mediaFile.filename,
			'video',
			'video',
			mediaFile.exifTags.MediaCreateDate.toISOString(),
			new Date().toISOString(),
			fileSizeInBytes,
			'GoPro HERO7 Black Edition',
			mediaFile.exifTags.ImageWidth,
			mediaFile.exifTags.ImageHeight,
			Math.trunc(mediaFile.exifTags.Duration),
			'HD7.01.01.70.00',
			'LAJ123456789012',
			0,
			0,
			0,
			0,
			new Date().toISOString(),
			0
		)
	}

	async contains(file) {
		const rows = (await this.db).all(
			'select * from media where filename=?',
			file.filename
		)
		return rows.length >= 1
	}
}

module.exports = GoproMedia
