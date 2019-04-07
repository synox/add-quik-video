const {exiftool} = require('exiftool-vendored')

class MediaFile {
	constructor(filename, exifTags) {
		this.filename = filename
		this.exifTags = exifTags
	}

	isValid() {
		return Boolean(this.exifTags)
	}

	static async load(filename) {
		const exifTags = await this.getExifTagsSafely(filename)
		if (exifTags) {
			return new MediaFile(filename, exifTags)
		}

		return new MediaFile(filename, null)
	}

	static async end() {
		await exiftool.end()
	}

	static async getExifTagsSafely(filename) {
		try {
			const exifTags = await exiftool.read(filename)
			if (!exifTags.MediaCreateDate) {
				return null
			}

			return exifTags
		} catch (error) {
			return null
		}
	}
}

module.exports = MediaFile
