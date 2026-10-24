/**
 * zotfile-lite
 * Automatic PDF management: rename, move and attach attachment files based
 * on item metadata, using a wildcard format string.
 */

Zotero.ZotFileLite = {
    folderSep: null,
    messages_report: [],
    messages_error: [],
    messages_fatalError: [],
    excludeAutorenameKeys: [],
    notifierID: null,
    preferencePaneID: null,
    menuID: 'zotfile-itemmenu',

    _initialized: false,

    /* ------------------------------------------------------------------ */
    /* Preferences                                                         */
    /* ------------------------------------------------------------------ */

    getPref(pref) {
        return Zotero.Prefs.get('extensions.zotfile.' + pref, true);
    },

    setPref(pref, value) {
        Zotero.Prefs.set('extensions.zotfile.' + pref, value, true);
    },

    /* ------------------------------------------------------------------ */
    /* Localization                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * Small built-in dictionary. The old add-on used a .properties bundle;
     * keeping the strings here avoids a second localization mechanism and
     * works regardless of the Zotero UI language.
     */
    _strings: {
        'general.error': { en: 'zotfile-lite Error', zh: 'zotfile-lite 错误' },
        'general.report': { en: 'zotfile-lite Report', zh: 'zotfile-lite 报告' },
        'general.warning.skippedAtt.msg': {
            en: 'Attachments skipped because they are top-level items, snapshots, an avoided filetype, or the file does not exist.',
            zh: '附件被跳过:可能是独立条目、快照、被排除的文件类型,或文件不存在。'
        },
        'general.newAttachment': { en: 'zotfile-lite: New attachment', zh: 'zotfile-lite:新附件' },
        'general.newAttachmentRenamed': { en: 'zotfile-lite: New attachment file renamed', zh: 'zotfile-lite:新附件已重命名' },
        'general.newAttachmentsAdded': { en: 'zotfile-lite: New attachment(s) added', zh: 'zotfile-lite:已添加新附件' },

        'renaming.askRename': {
            en: 'Rename the new attachment?\n\n%1$S\n→ %2$S',
            zh: '是否重命名新附件?\n\n%1$S\n→ %2$S'
        },
        'renaming.imported': { en: "'%S' (imported)", zh: "'%S'(已导入)" },
        'renaming.linked': { en: "'%S' (linked)", zh: "'%S'(已链接)" },
        'renaming.renamed': { en: 'zotfile-lite: Renamed Attachments', zh: 'zotfile-lite:已重命名附件' },
        'renaming.moreAttachments': {
            en: '… and %S more (click to close)',
            zh: '… 另有 %S 个(点击窗口可关闭)'
        },
        'renaming.renamingFailed': { en: 'zotfile-lite failed to automatically rename an attachment.', zh: 'zotfile-lite 自动重命名附件失败。' },
        'renaming.renameAttach.confirm': {
            en: "Do you want to rename and attach/link the file '%S' to the currently selected Zotero item?",
            zh: '是否要将文件"%S"重命名并附加/链接到当前选中的 Zotero 条目?'
        },
        'renaming.renameAttach.wrongItem': {
            en: 'Selected item is either an attachment, a note, or a collection.',
            zh: '选中的条目是附件、笔记或分类。'
        },
        'renaming.renameAttach.noFileFound': { en: 'No corresponding file found in source folder.', zh: '在源文件夹中未找到对应的文件。' },
        'renaming.moveRename': { en: 'Do you want to move and rename %S attachments?', zh: '是否要移动并重命名 %S 个附件?' },
        'renaming.addUserInput.prompt': {
            en: 'Enter a file suffix\n\nOriginal filename\n%1$S\n\nNew filename\n%2$S (YOUR INPUT)',
            zh: '请输入文件名后缀\n\n原文件名\n%1$S\n\n新文件名\n%2$S(你的输入)'
        },
        'renaming.selectCollectionPath': { en: 'Select the collection to use for the filename:', zh: '选择用于文件名的分类:' },
        'renaming.errorFormat.closing': { en: "Error in renaming format: unmatched closing '%1$S' at position %2$S.", zh: "重命名格式错误:位置 %2$S 处多余的 '%1$S'。" },
        'renaming.errorFormat.opening': { en: "Error in renaming format: unmatched opening '%1$S' at position %2$S.", zh: "重命名格式错误:位置 %2$S 处未闭合的 '%1$S'。" },
        'renaming.errorFormat.left': { en: "Missing left wildcard for '|' at position %S.", zh: "位置 %S 处的 '|' 左侧缺少通配符。" },
        'renaming.errorFormat.right': { en: "Missing right wildcard for '|' at position %S.", zh: "位置 %S 处的 '|' 右侧缺少通配符。" },

        'file.invalidSourceFolder': {
            en: 'The source folder is not valid. Please set a valid source folder in the zotfile-lite preferences.',
            zh: '源文件夹无效,请在 zotfile-lite 首选项中设置。'
        },
        'error.unknown': { en: 'Unknown error! See Help → Debug Output Logging for details.', zh: '未知错误!详情见"帮助 → 调试输出日志"。' },

        'menu.rename': { en: 'Rename and Move Attachment', zh: '重命名并移动附件' },
        'menu.attachFile': { en: 'Attach New File from Source Folder', zh: '从源文件夹附加新文件' },
        'menu.preferences': { en: 'zotfile-lite Preferences…', zh: 'zotfile-lite 首选项…' },
        'menu.submenu': { en: 'zotfile-lite', zh: 'zotfile-lite' },

        'prefs.preview': { en: 'Preview: %S', zh: '预览:%S' },
        'prefs.previewNoItem': {
            en: '[select a Zotero item to preview the filename]',
            zh: '[选中一个 Zotero 条目以预览文件名]'
        }
    },

    ZFgetString(name, params) {
        let entry = this._strings[name];
        let lang = Zotero.locale && Zotero.locale.startsWith('zh') ? 'zh' : 'en';
        let str = entry ? (entry[lang] || entry.en) : name;
        if (params !== undefined) {
            if (typeof params !== 'object') params = [params];
            params.forEach((value, i) => {
                // %S and %1$S style
                str = str.replace('%' + (i + 1) + '$S', value).replace('%S', value);
            });
        }
        return str;
    },

    /* ------------------------------------------------------------------ */
    /* Lifecycle                                                           */
    /* ------------------------------------------------------------------ */

    async init({ id, version, rootURI }) {
        this.pluginID = id;
        this.version = version;
        this.rootURI = rootURI;
        this.folderSep = Zotero.isWin ? '\\' : '/';

        if (this._initialized) return;
        this._initialized = true;

        // Automatically rename new attachments
        this.notifierID = Zotero.Notifier.registerObserver(this.notifier, ['item'], 'zotfile-lite');

        // Preferences pane
        try {
            this.preferencePaneID = await Zotero.PreferencePanes.register({
                pluginID: id,
                id: 'zotfile-prefpane',
                src: rootURI + 'content/preferences.xhtml',
                label: 'zotfile-lite',
                scripts: [rootURI + 'content/preferences.js'],
                stylesheets: [rootURI + 'content/preferences.css']
            });
        }
        catch (e) {
            Zotero.logError(e);
        }

        // Item context menu
        try {
            Zotero.MenuManager.registerMenu({
                menuID: this.menuID,
                pluginID: id,
                target: 'main/library/item',
                menus: this.UI.getMenuTemplate()
            });
        }
        catch (e) {
            Zotero.logError(e);
        }

        Zotero.debug('zotfile-lite ' + version + ' initialized');
    },

    shutdown() {
        if (this.notifierID) {
            Zotero.Notifier.unregisterObserver(this.notifierID);
            this.notifierID = null;
        }
        try {
            Zotero.MenuManager.unregisterMenu(this.menuID);
        }
        catch (e) {}
        try {
            Zotero.PreferencePanes.unregister(this.preferencePaneID);
        }
        catch (e) {}
        this._initialized = false;
    },

    /* ------------------------------------------------------------------ */
    /* Selection helpers                                                   */
    /* ------------------------------------------------------------------ */

    getActivePane() {
        return Zotero.getActiveZoteroPane();
    },

    /**
     * Group libraries (and feeds) cannot hold linked files, so attachments
     * there always have to be imported into Zotero storage.
     */
    _isGroupLibrary(item) {
        try {
            let library = Zotero.Libraries.get(item.libraryID);
            return library && library.libraryType !== 'user';
        }
        catch (e) {
            return false;
        }
    },

    /**
     * Path of the Zotero storage folder, or null.
     */
    _storageDir() {
        try {
            return Zotero.getStorageDirectory().path;
        }
        catch (e) {
            return null;
        }
    },

    /**
     * All attachments of the current selection (attachments of selected
     * regular items plus selected attachments). Returns attachment IDs.
     */
    getSelectedAttachments() {
        let pane = this.getActivePane();
        if (!pane) return [];
        let items = pane.getSelectedItems() || [];
        let attachments = [];
        for (let item of items) {
            if (item.isRegularItem()) {
                for (let id of item.getAttachments()) attachments.push(id);
            }
            else if (item.isAttachment()) {
                attachments.push(item.id);
            }
        }
        let out = [];
        for (let id of Zotero.Utilities.arrayUnique(attachments)) {
            let att = Zotero.Items.get(id);
            if (!att || !att.isAttachment()) continue;
            // skip linked URLs — they have no file
            if (att.attachmentLinkMode === Zotero.Attachments.LINK_MODE_LINKED_URL) continue;
            out.push(id);
        }
        return out;
    },

    /**
     * Path components of the collections an item belongs to.
     */
    getCollectionPathsOfItem(item) {
        let paths = [];
        for (let collectionID of item.getCollections()) {
            let parts = [];
            let collection = Zotero.Collections.get(collectionID);
            while (collection) {
                parts.unshift(collection.name);
                collection = collection.parentID ? Zotero.Collections.get(collection.parentID) : null;
            }
            paths.push(parts.join(this.folderSep));
        }
        return paths;
    },

    /* ------------------------------------------------------------------ */
    /* Filenames                                                           */
    /* ------------------------------------------------------------------ */

    checkFileType(att) {
        if (!this.getPref('useFileTypes')) return true;
        let name = att.attachmentFilename || '';
        let filetype = this.Utils.getFiletype(name);
        let types = this.getPref('filetypes').toLowerCase().split(',').map(s => s.trim());
        return types.includes(filetype);
    },

    /**
     * Filename without extension, built from item metadata and the current
     * renaming options. Also used by the preferences pane preview.
     */
    formatFilename(item, format) {
        if (this.getPref('useZoteroToRename')) return Zotero.Attachments.getFileBaseNameFromItem(item);

        let itemTypeName = Zotero.ItemTypes.getName(item.itemTypeID);
        if (format === undefined) {
            format = itemTypeName === 'patent'
                ? this.getPref('renameFormat_patent')
                : this.getPref('renameFormat');
        }
        let filename = this.Wildcards.replaceWildcard(item, format);
        filename = filename.replace(/[/\\?*:|"<>]/g, '');
        filename = Zotero.Utilities.trimInternal(filename);
        if (this.getPref('removePeriods')) filename = filename.replace(/\./g, '');
        if (this.getPref('replace_blanks')) filename = filename.replace(/ /g, '_');
        if (this.getPref('lower_case')) filename = filename.toLowerCase();
        if (this.getPref('removeDiacritics')) filename = Zotero.Utilities.removeDiacritics(filename);
        return filename;
    },

    /**
     * Build the new filename from item metadata.
     */
    getFilename(item, name, format) {
        if (!item.isRegularItem()) throw new Error('getFilename: not a regular Zotero item.');

        if (this.getPref('disable_renaming')) return name;

        let filename = this.formatFilename(item, format);

        if (this.getPref('userInput')) filename = this.addUserInput(filename, name);

        let filetype = this.Utils.getFiletype(name);
        if (filetype !== '') filename += '.' + filetype;

        return Zotero.File.getValidFileName(filename);
    },

    addUserInput(filename, originalFilename) {
        let defaultStr = this.getPref('userInput_Default');
        if (defaultStr === '[original filename]') defaultStr = originalFilename;
        let result = { value: null };
        let ok = Services.prompt.prompt(
            null,
            'zotfile-lite',
            this.ZFgetString('renaming.addUserInput.prompt', [originalFilename, filename]),
            result,
            null,
            { value: defaultStr }
        );
        if (ok && result.value) filename = filename + ' (' + result.value + ')';
        return filename;
    },

    /**
     * Folder names from a subfolder rule such as "%w/%y", one per level.
     */
    formatSubfolder(item, format) {
        if (!format) return [];
        // normalize separators so both / and \ work in the rule
        format = format.replace(/^[/\\]+|[/\\]+$/g, '');
        let subfolder = this.Wildcards.replaceWildcard(item, format);
        return subfolder.split(/[/\\]+/)
            .filter(s => s !== '' && s !== this.Wildcards.emptyCollectionPlaceholder)
            .map(s => Zotero.File.getValidFileName(s));
    },

    /**
     * Full destination folder for an item.
     */
    getLocation(basefolder, item, format) {
        if (!item.isRegularItem()) throw new Error('getLocation: not a regular Zotero item.');
        if (typeof basefolder !== 'string') throw new Error("getLocation: 'basefolder' is not a string.");
        let parts = this.formatSubfolder(item, format);
        // PathUtils.join() takes one folder name per argument; a component
        // containing a path separator throws NS_ERROR_FILE_UNRECOGNIZED_PATH.
        return parts.length ? PathUtils.join(basefolder, ...parts) : basefolder;
    },

    /* ------------------------------------------------------------------ */
    /* File system                                                         */
    /* ------------------------------------------------------------------ */

    /**
     * Move a file, creating destination folders as needed and adding a
     * numeric suffix if the target name is taken.
     * @return {string} the new path
     */
    async moveFile(sourcePath, target, filename) {
        if (!(await this.Utils.exists(sourcePath))) {
            throw new Error("moveFile(): source file does not exist: " + sourcePath);
        }
        let destPath = filename === undefined ? target : PathUtils.join(target, filename);
        if (PathUtils.normalize(sourcePath) === PathUtils.normalize(destPath)) return destPath;
        destPath = await this._uniquePath(destPath, sourcePath);

        let destDir = PathUtils.parent(destPath);
        await IOUtils.makeDirectory(destDir, { createAncestors: true, ignoreExisting: true });
        await IOUtils.move(sourcePath, destPath, { noOverwrite: true });

        // clean up folders that became empty
        await this.removeEmptyFolders(PathUtils.parent(sourcePath));
        return destPath;
    },

    async _uniquePath(destPath, sourcePath) {
        let k = 2;
        while (await this.Utils.exists(destPath)) {
            let candidate = this.Utils.addNumericalSuffix(destPath, k);
            if (PathUtils.normalize(candidate) === PathUtils.normalize(sourcePath)) return candidate;
            destPath = candidate;
            if (++k > 999) throw new Error("'" + PathUtils.filename(destPath) + "' already exists.");
        }
        return destPath;
    },

    /**
     * Delete a folder if it is empty.
     */
    async removeEmptyFolders(folder) {
        if (!folder) return;
        let bases = [];
        let dataDir = this._storageDir();
        if (dataDir) bases.push(PathUtils.normalize(dataDir));
        for (let pref of ['source_dir', 'dest_dir']) {
            let dir = this.getPref(pref);
            if (dir) bases.push(PathUtils.normalize(dir));
        }

        let current = PathUtils.normalize(folder);
        while (true) {
            if (bases.includes(current)) break;
            if (!(await this.Utils.isDirectory(current))) break;
            try {
                let children = await IOUtils.getChildren(current);
                if (children.length > 0) break;
                await IOUtils.remove(current, { ignoreAbsent: true });
            }
            catch (e) {
                break;
            }
            let parent = PathUtils.parent(current);
            if (!parent || parent === current) break;
            current = parent;
        }
    },

    /* ------------------------------------------------------------------ */
    /* Source folder                                                       */
    /* ------------------------------------------------------------------ */

    async getSourceDir(message) {
        let dir = this.getPref('source_dir');
        if (!dir || !(await this.Utils.exists(dir))) {
            if (message) this.infoWindow(this.ZFgetString('general.error'), this.ZFgetString('file.invalidSourceFolder'));
            return undefined;
        }
        return dir;
    },

    _allowedFiletypes() {
        if (!this.getPref('useFileTypes')) return null;
        return this.getPref('filetypes').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    },

    async getFilesInFolder(path) {
        if (!(await this.Utils.isDirectory(path))) {
            throw new Error("'" + path + "' is not a directory.");
        }
        return this.Utils.getFilesInDirectory(path, this._allowedFiletypes());
    },

    /**
     * Path of the most recently modified file in a folder.
     */
    async getLastFileInFolder(path) {
        let files = await this.getFilesInFolder(path);
        let newest = null, newestTime = 0;
        for (let file of files) {
            let time = await this.Utils.getLastModification(file);
            if (time > newestTime) {
                newestTime = time;
                newest = file;
            }
        }
        return newest;
    },

    /* ------------------------------------------------------------------ */
    /* Attaching                                                           */
    /* ------------------------------------------------------------------ */

    /**
     * Attach a file to a regular item, renaming/moving according to prefs.
     */
    async attachFile(item, path) {
        if (!item.isRegularItem()) throw new Error("attachFile(): 'item' is not a regular item.");

        let imported = this.getPref('import') || this._isGroupLibrary(item);

        if (imported) {
            this.excludeAutorenameKeys.push(item.key);
            let att = await Zotero.Attachments.importFromFile({
                file: path,
                libraryID: item.libraryID,
                parentItemID: item.id,
                collections: undefined,
                saveOptions: { skipSelect: true }
            });
            att = await this.renameAttachment(att);
            // remove the source file once it has been imported
            let newPath = await att.getFilePathAsync();
            if (newPath && PathUtils.normalize(path) !== PathUtils.normalize(newPath)) {
                try {
                    await IOUtils.remove(path, { ignoreAbsent: true });
                }
                catch (e) {}
            }
            return att;
        }

        // linked attachment in the destination folder
        let filename = this.getFilename(item, PathUtils.filename(path));
        let subfolder = this.getPref('subfolder') ? this.getPref('subfolderFormat') : '';
        let location = this.getLocation(this.getPref('dest_dir'), item, subfolder);
        let newPath = await this.moveFile(path, location, filename);
        return Zotero.Attachments.linkFromFile({
            file: newPath,
            libraryID: item.libraryID,
            parentItemID: item.id,
            collections: undefined,
            saveOptions: { skipSelect: true }
        });
    },

    /**
     * "Attach New File": take the newest (or all) file(s) from the source
     * folder and attach them to the selected item.
     */
    async attachFileFromSourceDirectory() {
        let pane = this.getActivePane();
        if (!pane) return;
        let selected = pane.getSelectedItems() || [];
        let item = selected[0];
        if (!item) return;
        if (!item.isTopLevelItem()) item = Zotero.Items.get(item.parentItemID);

        if (!item || !item.isRegularItem()) {
            this.handleErrors(this.ZFgetString('renaming.renameAttach.wrongItem'));
            return;
        }

        let sourceDir = await this.getSourceDir(true);
        if (!sourceDir) return;

        let paths = this.getPref('allFiles')
            ? await this.getFilesInFolder(sourceDir)
            : [await this.getLastFileInFolder(sourceDir)];
        paths = paths.filter(Boolean);
        if (paths.length === 0) {
            this.handleErrors(this.ZFgetString('renaming.renameAttach.noFileFound'));
            return;
        }

        if (this.getPref('confirmation')) {
            let confirmed = Services.prompt.confirm(
                null,
                'zotfile-lite',
                this.ZFgetString('renaming.renameAttach.confirm', [PathUtils.filename(paths[0])])
            );
            if (!confirmed) return;
        }

        let progressWin = this.progressWindow(this.ZFgetString('general.newAttachmentsAdded'));
        for (let path of paths) {
            let att = await this.attachFile(item, path);
            if (att) {
                let progress = new progressWin.ItemProgress(att.getItemTypeIconName(), att.getField('title'));
                progress.setProgress(100);
            }
        }
        progressWin.startCloseTimer(this.getPref('info_window_duration'));
        this.showReportMessages(null);
    },

    /* ------------------------------------------------------------------ */
    /* Renaming                                                            */
    /* ------------------------------------------------------------------ */

    /**
     * Move and/or rename one attachment according to its parent item.
     *
     * @param {Zotero.Item} att
     * @param {boolean} [imported]  store in Zotero storage instead of linking
     * @param {boolean} [rename]    rename the file (default true)
     * @param {string}  [folder]    destination folder for linked files
     * @param {string}  [subfolder] subfolder rule
     * @param {boolean} [verbose]   report the result
     * @return {Zotero.Item} the (possibly new) attachment
     */
    async renameAttachment(att, imported, rename, folder, subfolder, verbose) {
        imported = imported === undefined ? this.getPref('import') : imported;
        rename = rename === undefined ? true : rename;
        folder = folder === undefined ? this.getPref('dest_dir') : folder;
        subfolder = subfolder === undefined
            ? (!imported && this.getPref('subfolder') ? this.getPref('subfolderFormat') : '')
            : subfolder;
        verbose = verbose === undefined ? true : verbose;

        if (!att.isAttachment()) throw new Error('renameAttachment(): no attachment item.');
        if (att.isTopLevelItem()) throw new Error('renameAttachment(): attachment is a top-level item.');

        let item = Zotero.Items.get(att.parentItemID);
        let path = await att.getFilePathAsync();
        if (!path) throw new Error('renameAttachment(): attachment file does not exist.');

        let linkmode = att.attachmentLinkMode;
        if (!att.isImportedAttachment() && linkmode !== Zotero.Attachments.LINK_MODE_LINKED_FILE) {
            return att;
        }

        let filename = rename ? this.getFilename(item, att.attachmentFilename) : att.attachmentFilename;
        let location = this.getLocation(folder, item, subfolder);
        let currentDir = PathUtils.parent(path);
        // never move a file that already sits where it belongs
        let sameDir = PathUtils.normalize(currentDir) === PathUtils.normalize(location);
        let isGroup = this._isGroupLibrary(item);

        // (a) linked -> imported: import the file into Zotero storage
        if (imported && linkmode === Zotero.Attachments.LINK_MODE_LINKED_FILE) {
            let attNew = await Zotero.Attachments.importFromFile({
                file: path,
                libraryID: item.libraryID,
                parentItemID: item.id,
                collections: undefined,
                saveOptions: { skipSelect: true }
            });
            await attNew.renameAttachmentFile(filename, { overwrite: true, updateTitle: false });
            attNew.setField('title', filename);
            await this._transferAttachmentData(att, attNew);
            await attNew.saveTx();

            await att.eraseTx();
            await this._removeFileQuietly(path);
            await this.removeEmptyFolders(currentDir);
            if (verbose) this.messages_report.push(this.ZFgetString('renaming.imported', [filename]));
            return attNew;
        }

        // (b) imported -> imported (or any group library): rename in place
        if ((imported && att.isImportedAttachment()) || isGroup) {
            await att.renameAttachmentFile(filename, { overwrite: true, updateTitle: false });
            att.setField('title', filename);
            await att.saveTx();
            if (verbose) this.messages_report.push(this.ZFgetString('renaming.imported', [filename]));
            return att;
        }

        // (c) imported -> linked: move the file out of storage, link it
        if (att.isImportedAttachment() && !imported) {
            let newPath = await this.moveFile(path, location, filename);
            let attNew = await Zotero.Attachments.linkFromFile({
                file: newPath,
                libraryID: item.libraryID,
                parentItemID: item.id,
                collections: undefined,
                saveOptions: { skipSelect: true }
            });
            attNew.setField('title', filename);
            await this._transferAttachmentData(att, attNew);
            await attNew.saveTx();

            await att.eraseTx();
            await this.removeEmptyFolders(currentDir);
            if (verbose) this.messages_report.push(this.ZFgetString('renaming.linked', [filename]));
            return attNew;
        }

        // (d) linked -> linked
        if (!att.isImportedAttachment() && !imported) {
            if (!sameDir || PathUtils.filename(path) !== filename) {
                let newPath = await this.moveFile(path, location, filename);
                await att.relinkAttachmentFile(newPath);
            }
            att.setField('title', filename);
            await att.saveTx();
            if (verbose) this.messages_report.push(this.ZFgetString('renaming.linked', [filename]));
            return att;
        }

        return att;
    },

    /**
     * Carry notes, tags, relations, child items (annotations) and the
     * full-text index over to a replacement attachment.
     */
    async _transferAttachmentData(att, attNew) {
        try {
            let note = att.getNote();
            if (note) attNew.setNote(note);
            let tags = att.getTags();
            if (tags.length) attNew.setTags(tags);
            let relations = att.getRelations();
            if (relations && Object.keys(relations).length) attNew.setRelations(relations);
        }
        catch (e) {
            Zotero.logError(e);
        }

        try {
            await Zotero.DB.executeTransaction(async () => {
                await Zotero.Items.moveChildItems(att, attNew);
            });
        }
        catch (e) {
            Zotero.logError(e);
        }

        try {
            await Zotero.Relations.copyObjectSubjectRelations(att, attNew);
        }
        catch (e) {
            Zotero.logError(e);
        }

        try {
            await Zotero.DB.executeTransaction(async () => {
                await Zotero.Fulltext.transferItemIndex(att, attNew);
            });
        }
        catch (e) {
            Zotero.logError(e);
        }
    },

    async _removeFileQuietly(path) {
        try {
            await IOUtils.remove(path, { ignoreAbsent: true });
        }
        catch (e) {
            Zotero.logError(e);
        }
    },

    /**
     * Menu command: rename + move all selected attachments.
     */
    async renameSelectedAttachments() {
        let atts = Zotero.Items.get(this.getSelectedAttachments()).filter(att => this.checkFileType(att));

        if (this.getPref('confirmation_batch_ask') && atts.length >= this.getPref('confirmation_batch')) {
            let confirmed = Services.prompt.confirm(
                null,
                'zotfile-lite',
                this.ZFgetString('renaming.moveRename', [atts.length])
            );
            if (!confirmed) return;
        }

        let progressWin = this.progressWindow(this.ZFgetString('renaming.renamed'));
        let skipped = atts.length === 0;
        // One row per attachment makes the window grow without bound on big
        // selections; list the first few and summarise the rest.
        const MAX_ROWS = 5;
        let rows = 0;
        let overflow = 0;

        for (let att of atts) {
            let showRow = rows < MAX_ROWS;
            let progress = showRow
                ? new progressWin.ItemProgress(att.getItemTypeIconName(), att.getField('title'))
                : null;
            if (showRow) rows++;
            else overflow++;
            try {
                if (!(await att.fileExists()) || att.isTopLevelItem()) {
                    skipped = true;
                    progress?.setError();
                    continue;
                }
                let renamed = await this.renameAttachment(att);
                if (!renamed) {
                    progress?.setError();
                    continue;
                }
                if (progress) {
                    progress.setText(renamed.attachmentFilename);
                    progress.setProgress(100);
                }
            }
            catch (e) {
                Zotero.logError(e);
                this.messages_fatalError.push(e);
                progress?.setError();
            }
        }

        if (overflow > 0) {
            progressWin.addDescription(this.ZFgetString('renaming.moreAttachments', [overflow]));
        }
        if (skipped) progressWin.addDescription(this.ZFgetString('general.warning.skippedAtt.msg'));
        progressWin.startCloseTimer(this.getPref('info_window_duration'));
        this.showReportMessages(null);
        this.handleErrors();
    },

    /* ------------------------------------------------------------------ */
    /* Messages                                                            */
    /* ------------------------------------------------------------------ */

    progressWindow(title) {
        let win = new Zotero.ProgressWindow();
        win.changeHeadline(title || 'zotfile-lite');
        win.show();
        return win;
    },

    infoWindow(title, message, time) {
        let win = this.progressWindow(title);
        if (typeof message === 'string') {
            win.addDescription(message);
        }
        else if (message && message.lines) {
            for (let line of message.lines) {
                let progress = new win.ItemProgress(null, line);
                progress.setProgress(100);
            }
        }
        win.startCloseTimer(time === undefined ? this.getPref('info_window_duration') : time);
        return win;
    },

    showReportMessages() {
        if (this.messages_report.length > 0) {
            this.infoWindow(this.ZFgetString('general.report'), { lines: this.messages_report });
        }
        this.messages_report = [];
    },

    handleErrors(extra) {
        if (extra !== undefined) this.messages_error.push(extra);
        let lines = this.messages_error.slice();
        // fatal errors were already sent to Zotero.logError where they occurred
        if (this.messages_fatalError.length > 0) lines.push(this.ZFgetString('error.unknown'));
        if (lines.length > 0) {
            this.infoWindow(this.ZFgetString('general.error'), {
                lines: Zotero.Utilities.arrayUnique(lines)
            });
        }
        this.messages_error = [];
        this.messages_fatalError = [];
    }
};
