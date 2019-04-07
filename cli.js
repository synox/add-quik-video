#!/usr/bin/env node
'use strict'
const path = require('path')
const fs = require('fs')
const sqlite = require('sqlite')
const meow = require('meow')
const uuidv1 = require('uuid/v1')
const {exiftool} = require('exiftool-vendored')
const platformFolders = require('platform-folders')
const GoProMedia = require('./goproMedia')
const MediaFile = require('./mediaFile')

const cli = meow(
	`
	Add videos to the GoPro Quik Desktop for Mac app.
	
	Usage
	  $ npx add-quik-video <videofile>
	  $ npx add-quik-video <videofile>  <videofile>…

	Examples
	  $ npx add-quik-video videos/IMG_1337.mp4 
	  $ npx add-quik-video *.mov
`,
	{
		flags: {}
	}
)

function checkFilesExist(filenamesFiltered) {
	filenamesFiltered
		.filter(filename => !fs.existsSync(filename))
		.forEach(filename => {
			console.error('file not found:', filename)
			process.exit(3)
		})
}

function ignoreDirectories(filenames) {
	const filenamesFiltered = filenames.filter(filename =>
		fs.statSync(filename).isFile()
	)
	return filenamesFiltered;
}

async function getAndVerifyFiles(filenames) {
	// stop if file does not exist
	checkFilesExist(filenames);

	const promises = ignoreDirectories(filenames)
		.map(filename => {
			// make path absolute
			return path.resolve(filename)
		})
		.map(async filename =>
			MediaFile.load(filename))

	return Promise.all(promises)
}

async function getMetadataAndLogErrors(filenames) {
	const files = await getAndVerifyFiles(filenames);

	files
		.filter(file => !file.isValid())
		.forEach(file =>
			console.error(`WARN: File ${file.filename} does not look like a video file`)
		)
	return files
		.filter(file => file.isValid())

}

async function init(args) {
	if (args.length === 0) {
		cli.showHelp(1);
	}

	const cleanFiles = await getMetadataAndLogErrors(args);

	let media = null
	try {
		media = new GoProMedia();
		await media.init()

		await Promise.all(
			cleanFiles.map(file => {
					if (!media.contains(file)) {
						return media.add(file)
							.catch(err => {
								console.error(`WARN: Can not import ${file.filename}.`, err)
							});
					} else {
						console.warn(`File ${file.filename} is already in media database`)
					}
				}
			)
		)

	} finally {
		if (media) {
			media.end()
		}
		MediaFile.end()
	}

}

init(cli.input).catch(error => {
	console.error(error);
	process.exit(1);
});
