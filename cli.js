#!/usr/bin/env node
'use strict'
const path = require('path')
const fs = require('fs')
const meow = require('meow')
const logSymbols = require('log-symbols')
const GoProMedia = require('./gopro-media')
const MediaFile = require('./media-file')

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
			console.error(logSymbols.error, 'file not found:', filename)
			process.exit(3)
		})
}

function ignoreDirectories(filenames) {
	const filenamesFiltered = filenames.filter(filename =>
		fs.statSync(filename).isFile()
	)
	return filenamesFiltered
}

async function getAndVerifyFiles(filenames) {
	// Stop if file does not exist
	checkFilesExist(filenames)

	const promises = ignoreDirectories(filenames)
		.map(filename => {
			// Make path absolute
			return path.resolve(filename)
		})
		.map(async filename => MediaFile.load(filename))

	return Promise.all(promises)
}

async function getMetadataAndLogErrors(filenames) {
	const files = await getAndVerifyFiles(filenames)

	files
		.filter(file => !file.isValid())
		.forEach(file =>
			console.error(
				logSymbols.error,
				`WARN: File ${file.filename} does not look like a video file`
			)
		)
	return files.filter(file => file.isValid())
}

async function init(args) {
	if (args.length === 0) {
		cli.showHelp(1)
	}

	const cleanFiles = await getMetadataAndLogErrors(args)

	let media = null
	try {
		media = new GoProMedia()
		await media.init()

		await Promise.all(
			cleanFiles.map(async file => {
				const containsMedia = await media.contains(file)
				if (containsMedia) {
					console.log(logSymbols.warning, `already in media: ${file.filename}`)
					return Promise.resolve()
				}

				return media
					.add(file)
					.then(() => console.log(logSymbols.success, 'added', file.filename))
					.catch(error => {
						console.error(
							logSymbols.error,
							`WARN: Can not import ${file.filename}.`,
							error
						)
					})
			})
		)
	} finally {
		if (media) {
			media.end()
		}

		MediaFile.end()
	}
}

init(cli.input).catch(error => {
	console.error(logSymbols.error, error)
	process.exit(1)
})
