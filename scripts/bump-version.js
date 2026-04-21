#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const rootPkg = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(rootPkg, "utf8"));

const parts = pkg.version.split(".").map(Number);
parts[2] += 1; // patch bump
pkg.version = parts.join(".");

fs.writeFileSync(rootPkg, JSON.stringify(pkg, null, 2) + "\n");

// Also write version to a shared file for the frontend
const versionFile = path.join(__dirname, "..", "packages", "shared", "version.json");
fs.mkdirSync(path.dirname(versionFile), { recursive: true });
fs.writeFileSync(versionFile, JSON.stringify({ version: pkg.version }) + "\n");

console.log(`Version bumped to ${pkg.version}`);
