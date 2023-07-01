#!/usr/bin/env node

import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import glob from 'glob';
import archiver from 'archiver';

const distDir = 'dist';
const ignoreArray = [
    "node_modules/*",
    "!node_modules/json5/",
    "src/**/*.js",
    "types/",
    "images/",
    ".git/",
    ".gitea/",
    ".github/",
    ".nvmrc",
    ".eslintignore",
    ".eslintrc.json",
    ".gitignore",
    ".DS_Store",
    "build.mjs",
    "mod.code-workspace",
    "package-lock.json",
    "tsconfig.json"
];

// Load the contents of the package.json file and build project package name
async function getProjectPackageName() {
    console.log("Loading package.json...");
    const packageJson = await fs.readJson('package.json');
    const { author, name, version } = packageJson;
    console.log(`Package info - Author: ${author}, Name: ${name}, Version: ${version}`);

    const projectName = `${author}-${name}-${version}`.replace(/[^a-z0-9]/gi, '').toLowerCase();
    console.log(`Project package name: ${projectName}`);
    return projectName;
}

// Check if a "dist" directory exists, if it does, remove it and create a new one.
async function prepareDistDirectory() {
    console.log("Preparing 'dist' directory...");
    if (await fs.pathExists(distDir)) {
        console.log("Removing existing 'dist' directory...");
        await fs.remove(distDir);
    }
    console.log("Creating 'dist' directory...");
    await fs.mkdir(distDir);
}

// Copy all files from the current directory to the "dist" directory excluding specified files/folders
async function copyFilesToDist(ignoreArray) {
    console.log("Copying files to 'dist' directory...");
    const files = glob.sync('**', { ignore: ignoreArray, nodir: true });

    for (const file of files) {
        const destination = path.join(distDir, file);
        await fs.copy(file, destination);
    }
}

// Compress the files in the "dist" directory into a zip file with maximum compression.
async function compressDistDirectory(projectName) {
    console.log("Compressing 'dist' directory...");
    const archivePath = path.join(os.tmpdir(), `${projectName}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });

    const output = fs.createWriteStream(archivePath);
    archive.pipe(output);

    archive.directory(distDir, projectName);

    await archive.finalize();

    console.log(`'dist' directory compressed to ${archivePath}`);
    return archivePath;
}

// Main function to execute the build process
async function main() {
    try {
        const projectName = await getProjectPackageName();

        await prepareDistDirectory();

        await copyFilesToDist(ignoreArray);

        const archivePath = await compressDistDirectory(projectName);

        console.log(`Build complete. Archive created at ${archivePath}`);
    } catch (error) {
        console.error(`Error during build: ${error}`);
    }
}

main();
