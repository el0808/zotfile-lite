/**
 * Zotero.ZotFileLite.UI
 * Registers the zotfile-lite entries in the item context menu.
 *
 * Zotero awaits every plugin's `onShowing` hook while building the item
 * context menu, so an exception there stops the *whole* menu from opening.
 * The onShowing hooks are therefore wrapped in try/catch.
 *
 * Labels are set as plain `label` attributes: the main window has no Fluent
 * bundle for this plugin, so a `data-l10n-id` would render as a blank item.
 */

Zotero.ZotFileLite.UI = {

    _safe(fn) {
        try {
            fn();
        }
        catch (e) {
            Zotero.logError(e);
        }
    },

    getMenuTemplate() {
        return [{
            menuType: 'submenu',
            onShowing: (event, context) => this._safe(() => this._setLabel(context, 'menu.submenu')),
            menus: [
                {
                    menuType: 'menuitem',
                    onShowing: (event, context) => this._safe(() => this._updateRenameItem(context)),
                    onCommand: () => Zotero.ZotFileLite.renameSelectedAttachments()
                },
                {
                    menuType: 'menuitem',
                    onShowing: (event, context) => this._safe(() => this._updateAttachItem(context)),
                    onCommand: () => Zotero.ZotFileLite.attachFileFromSourceDirectory()
                },
                {
                    menuType: 'separator'
                },
                {
                    menuType: 'menuitem',
                    onShowing: (event, context) => this._safe(() => this._setLabel(context, 'menu.preferences')),
                    onCommand: () => Zotero.Utilities.Internal.openPreferences(Zotero.ZotFileLite.preferencePaneID)
                }
            ]
        }];
    },

    /**
     * Enable "Rename and Move" only when the selection holds an attachment
     * that has a file (linked URLs are skipped).
     */
    _updateRenameItem(context) {
        this._setLabel(context, 'menu.rename');
        let hasFile = att => att && att.isAttachment()
            && att.attachmentLinkMode !== Zotero.Attachments.LINK_MODE_LINKED_URL;
        let usable = (context.items || []).some(item => item.isRegularItem()
            ? Zotero.Items.get(item.getAttachments()).some(hasFile)
            : hasFile(item));
        context.setEnabled(usable);
    },

    /**
     * "Attach New File" needs exactly one regular item (or one attachment,
     * whose parent is then used).
     */
    _updateAttachItem(context) {
        this._setLabel(context, 'menu.attachFile');
        let items = context.items || [];
        context.setEnabled(items.length === 1
            && (items[0].isRegularItem() || items[0].isAttachment()));
    },

    _setLabel(context, key) {
        if (context.menuElem) context.menuElem.setAttribute('label', Zotero.ZotFileLite.ZFgetString(key));
    }
};
