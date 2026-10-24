/**
 * Zotero.ZotFileLite.notifier
 * Observes newly added items and renames new attachments according to the
 * "automatic_renaming" preference.
 */

Zotero.ZotFileLite.notifier = {
    /**
     * Zotero.Notifier callback.
     */
    notify: async function (event, type, ids, extraData) {
        if (type !== 'item' || event !== 'add') return;
        let zf = Zotero.ZotFileLite;
        if (zf.getPref('automatic_renaming') == 1) return;

        let attachments;
        try {
            attachments = Zotero.Items.get(ids)
                .filter(att => att.isAttachment())
                .filter(att => att.isImportedAttachment() && !att.isTopLevelItem())
                .filter(att => zf.checkFileType(att));
            let existing = [];
            for (let att of attachments) {
                if (await att.fileExists()) existing.push(att);
            }
            attachments = existing;
        }
        catch (e) {
            Zotero.logError(e);
            return;
        }

        if (attachments.length === 0) return;
        // let Zotero finish writing the attachment before touching its file
        setTimeout(() => this._rename(attachments), 100);
    },

    _rename: async function (attachments) {
        let zf = Zotero.ZotFileLite;
        let mode = zf.getPref('automatic_renaming');

        for (let att of attachments) {
            try {
                let item = Zotero.Items.get(att.parentItemID);
                if (!item) continue;

                // attachFile() renames its own attachment; don't do it twice
                if (zf.excludeAutorenameKeys.includes(att.key) || zf.excludeAutorenameKeys.includes(item.key)) {
                    zf.excludeAutorenameKeys = zf.excludeAutorenameKeys
                        .filter(key => key !== item.key && key !== att.key);
                    continue;
                }

                // skip if the current filename already matches the target
                let current = (att.attachmentFilename || '').replace(/\.[^/.]+$/, '');
                let target = zf.getFilename(item, current);
                if (current.indexOf(target) === 0) continue;

                // 2 = always ask, 3 = ask only if the item has other files,
                // 4 = never ask
                let ask;
                if (mode == 2) {
                    ask = true;
                }
                else if (mode == 3) {
                    let files = Zotero.Items.get(item.getAttachments())
                        .filter(a => zf.checkFileType(a))
                        .filter(a => a.isImportedAttachment()
                            || a.attachmentLinkMode === Zotero.Attachments.LINK_MODE_LINKED_FILE);
                    ask = files.length > 1;
                }
                else if (mode == 4) {
                    ask = false;
                }
                else {
                    continue;
                }

                if (ask) {
                    let confirmed = Services.prompt.confirm(
                        null,
                        zf.ZFgetString('general.newAttachment'),
                        zf.ZFgetString('renaming.askRename', [att.attachmentFilename, target])
                    );
                    if (!confirmed) continue;
                }

                let renamed = await zf.renameAttachment(att, undefined, true, undefined, undefined, false);
                if (!renamed) continue;

                let win = zf.progressWindow(zf.ZFgetString('general.newAttachmentRenamed'));
                let progress = new win.ItemProgress(renamed.getItemTypeIconName(), renamed.attachmentFilename);
                progress.setProgress(100);
                win.startCloseTimer(zf.getPref('info_window_duration'));
            }
            catch (e) {
                Zotero.logError(e);
                zf.handleErrors(zf.ZFgetString('renaming.renamingFailed'));
            }
        }
    }
};
