/**
 * zotfile-lite preferences pane script.
 * Loaded into the preferences window; init() is called from the pane root's
 * inline onload, the same way Zotero's built-in panes do it.
 */

var { FilePicker } = ChromeUtils.importESModule('chrome://zotero/content/modules/filePicker.mjs');

Zotero.ZotFileLite.Preferences = {

    init(root) {
        this.root = root;

        // HTML buttons fire `click`; Zotero only compiles `oncommand` attributes.
        root.querySelector('#zotfile-choose-dest')
            .addEventListener('click', () => this.chooseFolder('extensions.zotfile.dest_dir', '#zotfile-dest-dir'));
        root.querySelector('#zotfile-choose-source')
            .addEventListener('click', () => this.chooseFolder('extensions.zotfile.source_dir', '#zotfile-source-dir'));

        // Live preview. Any option in the pane can change the result, so listen
        // on the root: the bubbling event arrives after Zotero's own listener
        // on the control has saved the preference. The selected item lives in
        // the main window, so also refresh whenever this window is focused.
        root.addEventListener('input', () => this.updatePreview());
        root.addEventListener('change', () => this.updatePreview());
        window.addEventListener('focus', () => this.updatePreview());
        this.updatePreview();

        // Integer preferences are bound by hand: the generic `preference`
        // attribute writes strings, which Zotero refuses for int prefs.
        for (let input of root.querySelectorAll('[data-zotfile-int-pref]')) {
            let key = input.getAttribute('data-zotfile-int-pref');
            input.value = Zotero.Prefs.get(key, true);
            input.addEventListener('input', () => {
                let value = parseInt(input.value, 10);
                if (!isNaN(value)) Zotero.Prefs.set(key, value, true);
            });
        }

        // "Automatic renaming" is an integer preference too.
        let current = String(Zotero.Prefs.get('extensions.zotfile.automatic_renaming', true));
        for (let radio of root.querySelectorAll('#zotfile-autorename input[type="radio"]')) {
            radio.checked = radio.value === current;
            radio.addEventListener('change', () => {
                Zotero.Prefs.set('extensions.zotfile.automatic_renaming', parseInt(radio.value, 10), true);
            });
        }
    },

    /**
     * Build a preview filename from the first selected regular item.
     */
    updatePreview() {
        let item = Zotero.getActiveZoteroPane()?.getSelectedItems()?.[0];
        if (item && !item.isRegularItem()) item = Zotero.Items.get(item.parentItemID);

        let text;
        if (!item || !item.isRegularItem()) {
            text = Zotero.ZotFileLite.ZFgetString('prefs.previewNoItem');
        }
        else {
            let rule = this.root.querySelector('#zotfile-format').value;
            try {
                text = Zotero.ZotFileLite.formatFilename(item, rule) + '.<ext>';
            }
            catch (e) {
                text = String(e.message || e);
            }
        }
        this.root.querySelector('#zotfile-preview').textContent = Zotero.ZotFileLite.ZFgetString('prefs.preview', [text]);
    },

    /**
     * Folder picker for the source/destination directory settings.
     */
    async chooseFolder(prefKey, inputSelector) {
        let fp = new FilePicker();
        fp.init(window, Zotero.getString('dataDir.selectDir'), fp.modeGetFolder);
        let current = Zotero.Prefs.get(prefKey, true);
        if (current) fp.displayDirectory = current;
        if (await fp.show() !== fp.returnOK) return;
        Zotero.Prefs.set(prefKey, fp.file, true);
        this.root.querySelector(inputSelector).value = fp.file;
    }
};
