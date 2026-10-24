# zotfile-lite

English | [简体中文](README.zh-CN.md)

An attachment manager for Zotero 7–10. It renames attachment files from item metadata (author, year, title, …), and can move them into a folder of your choice with rule-based subfolders.

## Installation

1. Download the latest `zotfile-lite.xpi` from the [Releases](https://github.com/el0808/zotfile-lite/releases) page.
2. In Zotero, open **Tools → Plugins**.
3. Click the gear icon in the top-right corner, choose **Install Plugin From File…**, and select the downloaded `zotfile-lite.xpi`.
4. No restart is needed. Right-click any item; a **zotfile-lite** submenu means the plugin is installed.

> If you installed an earlier build of this plugin (shown as "ZotFile for Zotero 10" or "zotero-lite"), remove it from the plugin list before installing. Your settings are kept.

## Usage

### Open the settings

Either:

- **Edit → Settings** (on macOS: **Zotero → Settings**), then pick **zotfile-lite** on the left; or
- right-click an item and choose **zotfile-lite → zotfile-lite Preferences…**.

### Filename format

Enter a rule under **Renaming Rules → Filename format**. The default is:

```
{%a_}{%y_}{%t}
```

which produces names like `Vaswani_2023_Attention Is All You Need.pdf`.

Select an item in the main window, then switch back to the settings window: the **Preview** line shows that item's filename under the current rule. It updates as soon as you change the rule or any option.

#### Wildcards

| Wildcard | Meaning |
| --- | --- |
| `%a` | Author last names (joined with `_`) |
| `%A` | First letter of the first author's last name |
| `%F` | Last name + first initial, e.g. `VaswaniA` |
| `%I` | Author initials, e.g. `AV` |
| `%g` | Full author name, e.g. `Vaswani, Ashish` |
| `%q` | Last name of the last author |
| `%d` | Editor last names |
| `%y` | Year |
| `%t` | Title (can be shortened, see options below) |
| `%h` | Short title |
| `%j` | Publication (journal) title |
| `%s` | Journal abbreviation |
| `%p` | Publisher |
| `%w` | Publisher by item type: journal for articles, university for theses, institution for reports, publisher otherwise |
| `%v` / `%e` / `%f` | Volume / issue / pages |
| `%T` | Item type |
| `%c` | Collection path of the item |
| `%b` | Better BibTeX citation key (requires Better BibTeX) |

#### Rule syntax

- **Braces `{…}`**: the text inside appears only when every wildcard inside has a value. With `{%a_}{%y_}{%t}`, an item without a year doesn't get a stray `_`.
- **Bar `|`**: uses the first wildcard that has a value. `%a|%d` means the authors, or the editors if there are no authors.

#### Filename options

| Option | Effect |
| --- | --- |
| Shorten long titles (cut at . : ? !) | Keep only the part of the title before the first period, colon, question mark or exclamation mark |
| Number next to it (default 80) | Maximum title length; anything longer is cut off |
| Cut long titles at a word boundary | Don't cut a word in half when shortening |
| Limit the number of authors + number (default 2) | When there are more authors than this, keep only the first author |
| Append "et al" when authors are truncated | Add ` et al` after a shortened author list |
| Remove periods / Replace blanks with underscores / Convert to lower case / Remove diacritics | Applied to the generated filename |
| Use Zotero's own filename scheme | Ignore the rule above and use Zotero's own file naming settings |

### Attachment location

- **Store copies in the Zotero library (imported attachment)**: when ticked, attachments stay in Zotero's storage folder and are only renamed.
- When unticked, attachments are moved to the **Destination folder for linked files** and kept in Zotero as linked files. Use **Choose...** to pick the folder.
- **Create subfolders**: builds subfolders under the destination folder from a rule. It uses the same wildcards, with `/` between levels; `/%w/%y` puts files in `destination\journal\year\`. Applies to linked attachments only.

Group libraries don't support linked files, so attachments there are always renamed in place as stored copies.

### Rename attachments manually

Select one or more items (or attachments), right-click and choose **zotfile-lite → Rename and Move Attachment**. Every attachment of the selected items that matches the file types is renamed by the current rule and moved according to the attachment location settings. You're asked to confirm when several attachments are processed at once.

A result window appears in the bottom-right corner; click it to close it right away. How long it stays can be changed under **Result Window** in the settings.

### Attach a new file from the source folder

Useful when you download a PDF in the browser and then want it on a Zotero item:

1. Under **Source Folder** in the settings, choose your downloads folder.
2. After downloading the PDF, select the item in Zotero, right-click and choose **zotfile-lite → Attach New File from Source Folder**.
3. The most recently modified file in the source folder is renamed and attached to the item after you confirm.

With **Attach all files in the source folder (not just the newest)** ticked, every file in the folder is attached at once. **Only these file types** limits which extensions are handled; the default is `pdf,doc,docx,txt,rtf,djvu,epub`.

### Automatic renaming

When a new attachment is added to an item (for example when saving a paper from the browser, or dropping a PDF onto an item), the **Automatic Renaming** setting decides what happens:

| Option | Behaviour |
| --- | --- |
| Never rename automatically | Nothing happens; rename manually |
| Always ask | Shows "old name → new name" every time and renames only after you confirm |
| Ask when the item already has other attachments | Renames right away if it's the item's only attachment, asks otherwise |
| Always rename | Renames without asking |

> Tip: Zotero 7 and later can rename attachments on its own (**Settings → General → File Renaming**). With both turned on, a file may be renamed by Zotero first and then again by this plugin, so keep only one of them on.

---

This project is based on the original [ZotFile](https://github.com/jlegewie/zotfile).
