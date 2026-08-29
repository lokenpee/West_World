#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(projectRoot, 'manifest.json');
const settingsPanelPath = path.join(projectRoot, 'txtToWorldbook', 'ui', 'settingsPanel.js');

function readUtf8(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function getManifestVersion(manifestText) {
    const match = manifestText.match(/"version"\s*:\s*"([^"]+)"/u);
    return match?.[1] || '';
}

function getUiVersion(settingsText) {
    const match = settingsText.match(/const\s+PLUGIN_VERSION\s*=\s*'([^']*)'/u);
    return match?.[1] || '';
}

function isValidVersion(version) {
    return /^[A-Za-z]?[0-9]+(?:\.[0-9]+){1,2}(?:[-+][0-9A-Za-z.-]+)?$/u.test(version);
}

function replaceOnce(text, pattern, replacement, label) {
    const globalPattern = new RegExp(
        pattern.source,
        pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
    );
    const matchCount = text.match(globalPattern)?.length || 0;
    if (matchCount !== 1) {
        throw new Error(`${label} 必须恰好匹配一次，实际匹配 ${matchCount} 次`);
    }
    return text.replace(pattern, replacement);
}

const manifestText = readUtf8(manifestPath);
const settingsText = readUtf8(settingsPanelPath);
const currentManifestVersion = getManifestVersion(manifestText);
const currentUiVersion = getUiVersion(settingsText);
const [, , requestedVersion, checkFlag] = process.argv;

if (checkFlag === '--check' || requestedVersion === '--check') {
    if (!currentManifestVersion || !currentUiVersion) {
        throw new Error('无法读取 manifest.json 或 settingsPanel.js 中的版本号');
    }
    if (currentManifestVersion !== currentUiVersion) {
        throw new Error(`版本不同步：manifest.json=${currentManifestVersion}，UI=${currentUiVersion}`);
    }
    console.log(`版本已同步：${currentManifestVersion}`);
    process.exit(0);
}

if (!requestedVersion || !isValidVersion(requestedVersion)) {
    console.error('用法：node scripts/set-version.mjs <version>');
    console.error('示例：node scripts/set-version.mjs A1.1');
    console.error('检查：node scripts/set-version.mjs --check');
    process.exit(1);
}

const nextManifestText = replaceOnce(
    manifestText,
    /("version"\s*:\s*")[^"]*(")/u,
    `$1${requestedVersion}$2`,
    'manifest.json version',
);
const nextSettingsText = replaceOnce(
    settingsText,
    /(const\s+PLUGIN_VERSION\s*=\s*')[^']*(')/u,
    `$1${requestedVersion}$2`,
    'UI PLUGIN_VERSION',
);

fs.writeFileSync(manifestPath, nextManifestText, 'utf8');
fs.writeFileSync(settingsPanelPath, nextSettingsText, 'utf8');
console.log(`版本已更新：${currentManifestVersion || '(空)'} -> ${requestedVersion}`);
