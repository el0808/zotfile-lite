/* eslint-disable no-undef */
/**
 * Bootstrap entry point for zotfile-lite.
 * Loads the plugin's scripts into this sandbox and hands control to
 * Zotero.ZotFileLite; shutdown() undoes the registrations.
 */

const SCRIPTS = [
    'content/zotfile-lite.js',
    'content/utils.js',
    'content/wildcards.js',
    'content/notifier.js',
    'content/ui.js'
];

// Zotero warns about missing bootstrap methods, so the unused ones stay
// as empty functions.
function install(data, reason) {}

function uninstall(data, reason) {}

function onMainWindowLoad({ window }, reason) {}

function onMainWindowUnload({ window }, reason) {}

async function startup({ id, version, rootURI }, reason) {
    await Zotero.initializationPromise;
    for (let script of SCRIPTS) {
        Services.scriptloader.loadSubScript(rootURI + script, globalThis);
    }
    await Zotero.ZotFileLite.init({ id, version, rootURI });
}

function shutdown(data, reason) {
    if (reason === APP_SHUTDOWN) return;
    Zotero.ZotFileLite?.shutdown();
    delete Zotero.ZotFileLite;
}
