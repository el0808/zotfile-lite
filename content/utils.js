/**
 * Zotero.ZotFileLite.Utils
 * Small helpers. OS.File / OS.Path are gone from Gecko 140, so everything
 * goes through IOUtils and PathUtils instead.
 */

Zotero.ZotFileLite.Utils = {

    /**
     * Get the file type (extension) from a filename, lowercased.
     */
    getFiletype(filename) {
        if (typeof filename !== 'string') {
            throw new Error("getFiletype(): 'filename' is not a string.");
        }
        let pos = filename.lastIndexOf('.');
        return pos === -1 ? '' : filename.substr(pos + 1).toLowerCase();
    },

    /**
     * Append " (k)" before the extension:  /a/Book.pdf -> /a/Book2.pdf
     */
    addNumericalSuffix(filename, k) {
        let ext = PathUtils.filename(filename).match(/(\.[\w\d]*)$/);
        if (!ext) return filename + k;
        return filename.substring(0, filename.length - ext[1].length) + k + ext[1];
    },

    /**
     * Does a file exist? Never throws.
     */
    async exists(path) {
        if (!path) return false;
        try {
            return await IOUtils.exists(path);
        }
        catch (e) {
            return false;
        }
    },

    /**
     * Last modification time in ms, or 0 if the file is missing.
     */
    async getLastModification(path) {
        try {
            let stat = await IOUtils.stat(path);
            return stat.lastModified || 0;
        }
        catch (e) {
            return 0;
        }
    },

    /**
     * Is `path` a directory? Never throws.
     */
    async isDirectory(path) {
        try {
            let stat = await IOUtils.stat(path);
            return stat.type === 'directory';
        }
        catch (e) {
            return false;
        }
    },

    /**
     * Non-hidden files directly inside a directory (full paths).
     */
    async getFilesInDirectory(path, filetypes) {
        let entries = await IOUtils.getChildren(path);
        let files = [];
        for (let entry of entries) {
            let name = PathUtils.filename(entry);
            if (name.startsWith('.')) continue;
            let stat;
            try {
                stat = await IOUtils.stat(entry);
            }
            catch (e) {
                continue;
            }
            if (stat.type === 'directory') continue;
            if (filetypes && !filetypes.includes(this.getFiletype(name))) continue;
            files.push(entry);
        }
        return files;
    }
};
