/* Default preferences for zotfile-lite.
 * Zotero loads this file from the plugin root on every start.
 */

/* Source folder ("Attach New File") */
pref("extensions.zotfile.source_dir", "");
pref("extensions.zotfile.allFiles", false);
pref("extensions.zotfile.useFileTypes", true);
pref("extensions.zotfile.filetypes", "pdf,doc,docx,txt,rtf,djvu,epub");

/* Renaming */
pref("extensions.zotfile.useZoteroToRename", false);
pref("extensions.zotfile.renameFormat", "{%a_}{%y_}{%t}");
pref("extensions.zotfile.renameFormat_patent", "{%a_}{%y_}{%t}");
pref("extensions.zotfile.disable_renaming", false);
pref("extensions.zotfile.truncate_title", true);
pref("extensions.zotfile.truncate_smart", true);
pref("extensions.zotfile.max_titlelength", 80);
pref("extensions.zotfile.truncate_authors", true);
pref("extensions.zotfile.max_authors", 2);
pref("extensions.zotfile.number_truncate_authors", 1);
pref("extensions.zotfile.add_etal", true);
pref("extensions.zotfile.etal", " et al");
pref("extensions.zotfile.authors_delimiter", "_");
pref("extensions.zotfile.removeDiacritics", false);
pref("extensions.zotfile.removePeriods", false);
pref("extensions.zotfile.replace_blanks", false);
pref("extensions.zotfile.lower_case", false);
pref("extensions.zotfile.userInput", false);
pref("extensions.zotfile.userInput_Default", "Paper");

/* Moving / linking */
pref("extensions.zotfile.dest_dir", "");
pref("extensions.zotfile.import", true);
pref("extensions.zotfile.subfolder", false);
pref("extensions.zotfile.subfolderFormat", "/%w/%y");

/* Confirmation / notifications */
pref("extensions.zotfile.confirmation", true);
pref("extensions.zotfile.confirmation_batch_ask", true);
pref("extensions.zotfile.confirmation_batch", 2);
pref("extensions.zotfile.info_window_duration", 2500);

/* Automatic renaming of new attachments
 * 1 = never, 2 = always ask, 3 = ask if the item already has attachments,
 * 4 = always rename
 */
pref("extensions.zotfile.automatic_renaming", 3);

/* Wildcards */
pref("extensions.zotfile.wildcards.default", '{"a": "author", "A": {"field": "author", "operations":[{"function":"exec","regex": "\\\\w{1}"},{"function":"toUpperCase"}]}, "F": "authorLastF", "I": "authorInitials", "d": "editor", "D": {"field": "editor", "operations":[{"function":"exec","regex": "\\\\w{1}"},{"function":"toUpperCase"}]}, "L": "editorLastF", "l": "editorInitials", "t": "titleFormated", "h": "shortTitle", "j": "publicationTitle", "s": "journalAbbreviation", "p": "publisher", "w": {"default": "publisher", "audioRecording": "label", "bill": "legislativeBody", "case": "court", "computerProgram": "company", "film": "distributor", "journalArticle": "publicationTitle", "magazineArticle": "publicationTitle", "newspaperArticle": "publicationTitle", "patent": "issuingAuthority", "presentation": "meetingName", "radioBroadcast": "network", "report": "institution", "thesis": "university", "tvBroadcast": "network"}, "n": "patentNumber", "i": "assignee", "y": "year", "v": "volume", "e": "issue", "T": "itemType", "f": "pages", "x": "extra", "c": "collectionPaths", "g": "authorLastG", "q":"lastAuthor", "Q":"lastAuthor_lastInitial", "u":"lastAuthor_lastf", "U":"lastAuthor_initials", "b":"citekey"}');
pref("extensions.zotfile.wildcards.user", "{}");
