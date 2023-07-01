#!/usr/bin/env node

import fs from "fs";
import os from "os";
import path from "path";
import archiver from "archiver";

const ignore = [
    ".git",
    ".github",
    ".gitlab",
    "dist",
    "images",
    "types",
    ".DS_Store",
    ".eslintignore",
    ".eslintrc.json",
    ".gitignore",
    ".nvmrc",
    "build.mjs",
    "mod.code-workspace",
    "package-lock.json",
    "tsconfig.json"
];

const allowedSubdirectories = {
    "node_modules": ["json5"]
};

async function loadPackageJson(currentDir)
{
    const packageJsonPath = path.join(currentDir, "package.json");
    const packageJsonContent = await fs.promises.readFile(packageJsonPath, "utf-8");
    return JSON.parse(packageJsonContent);
}

function createProjectName(packageJson)
{
    const author = packageJson.author.replace(/\W/g, "").toLowerCase();
    const name = packageJson.name.replace(/\W/g, "").toLowerCase();
    const version = packageJson.version;
    return `${author}-${name}-${version}`;
}

async function createTemporaryDirectoryWithProjectName(projectName)
{
    const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "my-build-"));
    const projectDir = path.join(tempDir, projectName);
    await fs.promises.mkdir(projectDir);
    return projectDir;
}

async function copyFiles(srcDir, destDir)
{
    try
    {
        const entries = await fs.promises.readdir(srcDir, { withFileTypes: true });

        for (const entry of entries)
        {
            const srcPath = path.join(srcDir, entry.name);
            const destPath = path.join(destDir, entry.name);

            if (ignore.includes(entry.name))
            {
                console.log(`Ignoring: ${entry.name}`);
                continue;
            }

            if (entry.isDirectory())
            {
                const parentDirName = path.basename(srcDir);

                if (parentDirName === "node_modules" && !allowedSubdirectories[parentDirName]?.includes(entry.name))
                {
                    console.log(`Ignoring: ${entry.name}`);
                    continue;
                }

                await fs.promises.mkdir(destPath);
                await copyFiles(srcPath, destPath);
            }
            else
            {
                // Ignore files that are directly within the allowedSubdirectories
                if (Object.keys(allowedSubdirectories).includes(path.basename(srcDir))) {
                    console.log(`Ignoring: ${entry.name}`);
                    continue;
                }

                await fs.promises.copyFile(srcPath, destPath);
                console.log(`Copied: ${srcPath} to ${destPath}`);
            }
        }
    }
    catch (err)
    {
        console.error("Error copying files:", err);
    }
}

async function createZipFile(directoryToZip, zipFilePath)
{
    return new Promise((resolve, reject) =>
    {
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver("zip", {
            zlib: { level: 9 } // Sets the compression level.
        });

        output.on("close", function()
        {
            console.log("Archiver has been finalized and the output file descriptor has closed.");
            resolve();
        });

        archive.on("error", function(err)
        {
            reject(err);
        });

        archive.pipe(output);
        archive.directory(directoryToZip, false);
        archive.finalize();
    });
}

async function cleanAndCreateDistDirectory(projectDir)
{
    const distPath = path.join(projectDir, "dist");
    await fs.promises.rm(distPath, { force: true, recursive: true });

    await fs.promises.mkdir(distPath);
    return distPath;
}

// Entry point
(async () =>
{
    const currentDir = path.dirname(new URL(import.meta.url).pathname);
    const packageJson = await loadPackageJson(currentDir);
    const projectName = createProjectName(packageJson);
    const projectDir = await createTemporaryDirectoryWithProjectName(projectName);

    console.log(`Temporary directory with project name created at: ${projectDir}`);

    await copyFiles(currentDir, projectDir);
    console.log("Files copied successfully!");

    const zipFilePath = path.join(os.tmpdir(), `${projectName}.zip`);
    await createZipFile(projectDir, zipFilePath);
    console.log(`Zip file created at: ${zipFilePath}`);

    const zipFileInProjectDir = path.join(projectDir, `${projectName}.zip`);
    await fs.promises.rename(zipFilePath, zipFileInProjectDir);
    console.log(`Zip file moved to: ${zipFileInProjectDir}`);

    const distDir = await cleanAndCreateDistDirectory(currentDir);
    await copyFiles(projectDir, path.join(distDir));    

    // Clean up temporary directory
    await fs.promises.rm(projectDir, { force: true, recursive: true });

    console.log("Script completed successfully.");
})();
