/**
 * Zotero.ZotFileLite.Wildcards
 * Turns a format rule such as "{%a_}{%y_}{%t}" into a filename.
 *
 * The rule language is unchanged: %x wildcards,
 * exclusive groups (%a|%d -> first non-empty) and conditional groups ({...}
 * included only when every wildcard inside resolved).
 */

Zotero.ZotFileLite.Wildcards = {
    emptyCollectionPlaceholder: 'EMPTY_COLLECTION_NAME',

    /**
     * Abbreviate a journal name using Zotero's own abbreviation list.
     * Returns '' when abbreviations aren't available.
     */
    abbreviateField(value) {
        if (!value) return '';
        try {
            let abbrv_obj = {};
            Zotero.Cite.getAbbreviation('N/A', abbrv_obj, 'default', 'container-title', value);
            return abbrv_obj['default']?.['container-title']?.[value] || '';
        }
        catch (e) {
            return '';
        }
    },

    /**
     * Index at which `find` should be inserted into a sorted array.
     */
    binaryArrayIndex(obj, find) {
        let low = 0, high = obj.length - 1, i;
        while (low <= high) {
            i = Math.floor((low + high) / 2);
            if (obj[i] < find) {
                low = i + 1;
                continue;
            }
            if (obj[i] > find) {
                high = i - 1;
                continue;
            }
            return i;
        }
        if (obj.length === 0) return 0;
        if (obj[i] < find) return i + 1;
        return i;
    },

    /**
     * All positions of `str` inside `rule`.
     */
    findStrPos(rule, str) {
        let positions = [];
        let last = rule.indexOf(str);
        while (last > -1) {
            positions.push(last);
            last = rule.indexOf(str, last + 1);
        }
        return positions;
    },

    /**
     * Shorten a title and replace characters that are invalid in filenames.
     */
    truncateTitle(title) {
        title = '' + title;

        const prefs = Zotero.ZotFileLite;
        // truncate title after : . ! ?
        if (prefs.getPref('truncate_title')) {
            let truncate = title.search(/:|\.|\?|!/);
            if (truncate !== -1) title = title.substr(0, truncate);
        }

        let maxLength = prefs.getPref('max_titlelength');
        if (title.length > maxLength) {
            let beforeTruncChar = title.substr(maxLength, 1);
            title = title.substr(0, maxLength);
            // cut back to the last word boundary
            if (prefs.getPref('truncate_smart') && title.search(' ') !== -1 && /[a-zA-Z0-9]/.test(beforeTruncChar)) {
                while (title.substring(title.length - 1, title.length) !== ' ') {
                    title = title.substring(0, title.length - 1);
                }
                title = title.substring(0, title.length - 1);
            }
        }
        else {
            let endchar = title.substring(title.length - 1, title.length);
            if (':?./\\><*|'.includes(endchar)) {
                title = title.substring(0, title.length - 1);
            }
        }

        // replace forbidden characters
        title = title.replace(/[/\\]/g, '-');
        title = title.replace(/[*|"<>]/g, '');
        title = title.replace(/[?:]/g, ' -');
        return title;
    },

    /**
     * Find the first balanced { ... } pair. Returns [{start, end}, ...] for
     * every outer pair; reports unmatched brackets to messages_error.
     */
    findOuterPairs(rule, open = '{', close = '}') {
        let matching = [];
        let outer = [];
        let res = { start: -1, end: -1 };
        for (let i = 0; i < rule.length; ++i) {
            if (rule[i] === open) {
                matching.push(i);
                if (res.start < 0) res.start = i;
            }
            else if (rule[i] === close) {
                if (matching.length === 0) {
                    Zotero.ZotFileLite.messages_error.push(
                        Zotero.ZotFileLite.ZFgetString('renaming.errorFormat.closing', [close, i])
                    );
                }
                matching.pop();
                if (matching.length === 0) {
                    res.end = i;
                    outer.push(res);
                    res = { start: -1, end: -1 };
                }
            }
        }
        if (matching.length > 0) {
            Zotero.ZotFileLite.messages_error.push(
                Zotero.ZotFileLite.ZFgetString('renaming.errorFormat.opening', [open, matching[0]])
            );
        }
        return outer;
    },

    /**
     * Author / editor strings used by the %a %F %I %d ... wildcards.
     */
    formatAuthors(item) {
        let prefs = Zotero.ZotFileLite;
        let itemType = Zotero.ItemTypes.getName(item.itemTypeID);
        let creatorTypeIDs;
        if (itemType === 'book') {
            creatorTypeIDs = [
                Zotero.CreatorTypes.getID('author'),
                Zotero.CreatorTypes.getID('editor')
            ];
        }
        else {
            creatorTypeIDs = [Zotero.CreatorTypes.getPrimaryIDForType(item.itemTypeID)];
        }

        let addEtal = prefs.getPref('add_etal');
        let author = '', authorLastF = '', authorInitials = '', authorLastG = '';
        let creators = item.getCreators();
        let numAuthors = creators.length;
        for (let creator of creators) {
            if (!creatorTypeIDs.includes(creator.creatorTypeID)) numAuthors--;
        }

        let maxAuthors = prefs.getPref('truncate_authors') ? prefs.getPref('max_authors') : 500;
        if (numAuthors <= maxAuthors) addEtal = false;
        else numAuthors = prefs.getPref('number_truncate_authors');

        let delimiter = prefs.getPref('authors_delimiter');
        let j = 0;
        for (let creator of creators) {
            if (j < numAuthors && creatorTypeIDs.includes(creator.creatorTypeID)) {
                let lastName = creator.lastName || '';
                let firstName = creator.firstName || '';
                author = author === '' ? lastName : author + delimiter + lastName;
                let lastf = lastName + firstName.substr(0, 1).toUpperCase();
                authorLastF = authorLastF === '' ? lastf : authorLastF + delimiter + lastf;
                let initials = firstName.substr(0, 1).toUpperCase() + lastName.substr(0, 1).toUpperCase();
                authorInitials = authorInitials === '' ? initials : authorInitials + delimiter + initials;
                let lastg = lastName + ', ' + firstName;
                authorLastG = authorLastG === '' ? lastg : authorLastG + delimiter + lastg;
                j++;
            }
        }
        if (addEtal) {
            let etal = prefs.getPref('etal');
            author += etal;
            authorLastF += etal;
            authorInitials += etal;
            authorLastG += etal;
        }

        // last (senior) author
        let lastAuthor = '', lastAuthorLastF = '', lastAuthorInitials = '', lastAuthorLastInitial = '';
        if (creators.length > 0) {
            let last = creators[creators.length - 1];
            let lastName = last.lastName || '';
            let firstName = last.firstName || '';
            lastAuthor = lastName;
            lastAuthorLastF = lastName + firstName.substr(0, 1).toUpperCase();
            lastAuthorInitials = firstName.substr(0, 1).toUpperCase() + lastName.substr(0, 1).toUpperCase();
            lastAuthorLastInitial = lastName.substr(0, 1).toUpperCase();
        }

        // editors
        let editorType = [3, 4, 5, 27, 29];
        let editor = '', editorLastF = '', editorInitials = '';
        let numEditors = creators.length;
        for (let creator of creators) {
            if (!editorType.includes(creator.creatorTypeID)) numEditors--;
        }
        if (numEditors <= maxAuthors) addEtal = false;
        else numEditors = prefs.getPref('number_truncate_authors');

        j = 0;
        for (let creator of creators) {
            if (j < numEditors && editorType.includes(creator.creatorTypeID)) {
                let lastName = creator.lastName || '';
                let firstName = creator.firstName || '';
                editor = editor === '' ? lastName : editor + delimiter + lastName;
                let lastf = lastName + firstName.substr(0, 1).toUpperCase();
                editorLastF = editorLastF === '' ? lastf : editorLastF + delimiter + lastf;
                let initials = firstName.substr(0, 1).toUpperCase() + lastName.substr(0, 1).toUpperCase();
                editorInitials = editorInitials === '' ? initials : editorInitials + delimiter + initials;
                j++;
            }
        }

        return [author, authorLastF, authorInitials, editor, editorLastF, editorInitials,
            authorLastG, lastAuthor, lastAuthorLastInitial, lastAuthorLastF, lastAuthorInitials];
    },

    /**
     * Build the map of %x -> value for one item.
     */
    wildcardTable(item) {
        let item_type = item.itemTypeID;
        let item_type_name = Zotero.ItemTypes.getName(item_type);
        let authors = this.formatAuthors(item);

        let addFields = {
            itemTypeEN: item_type_name,
            itemType: (() => {
                try {
                    return Zotero.ItemTypes.getLocalizedString(item_type);
                }
                catch (e) {
                    return item_type_name;
                }
            })(),
            titleFormated: this.truncateTitle(item.getField('title', false, true)),
            author: authors[0],
            authorLastF: authors[1],
            authorInitials: authors[2],
            editor: authors[3],
            editorLastF: authors[4],
            editorInitials: authors[5],
            authorLastG: authors[6],
            lastAuthor: authors[7],
            lastAuthor_lastInitial: authors[8],
            lastAuthor_lastf: authors[9],
            lastAuthor_initials: authors[10],
            collectionPaths: Zotero.ZotFileLite.getCollectionPathsOfItem(item),
            citekey: (() => {
                try {
                    return typeof Zotero.BetterBibTeX !== 'undefined' ? item.getField('citekey') : undefined;
                }
                catch (e) {
                    return undefined;
                }
            })()
        };

        const getValue = (field) => {
            if (field in addFields) return addFields[field];
            let value = item.getField(field, false, true);
            return value === null || value === undefined ? '' : value;
        };

        const itemtypeWildcard = (map) => {
            let property = (item_type_name in map) ? map[item_type_name] : map['default'];
            let value = '';
            if (typeof property === 'string') value = getValue(property);
            if (typeof property === 'object') value = regexWildcard(property);
            return value == null ? '' : value;
        };

        const regexWildcard = (w) => {
            let field = w.field;
            let operations = w.operations;
            let output = '';
            if (typeof field === 'string') output = getValue(field);
            if (typeof field === 'object') output = itemtypeWildcard(field);
            output = output == null ? '' : String(output);

            if (operations !== undefined) {
                for (let obj of operations) {
                    let regex = obj.regex,
                        replacement = ('replacement' in obj) ? obj.replacement : '',
                        flags = ('flags' in obj) ? obj.flags : 'g',
                        group = ('group' in obj) ? obj.group : 0,
                        re = new RegExp(regex, flags);
                    if (obj.function === 'replace') output = output.replace(re, replacement);
                    if (obj.function === 'exec') {
                        let match = re.exec(output);
                        output = (match === null) ? output : (match[group] || '');
                    }
                    if (obj.function === 'abbreviate') output = this.abbreviateField(output);
                    if (obj.function === 'toLowerCase') output = output.toLowerCase();
                    if (obj.function === 'toUpperCase') output = output.toUpperCase();
                    if (obj.function === 'trim') output = output.trim();
                    if (obj.function === 'truncateTitle') output = this.truncateTitle(output);
                }
            }
            return output;
        };

        let wildcards = JSON.parse(Zotero.ZotFileLite.getPref('wildcards.default'));
        let wildcards_user = JSON.parse(Zotero.ZotFileLite.getPref('wildcards.user'));
        for (let key in wildcards_user) wildcards[key] = wildcards_user[key];

        let table = {};
        for (let key in wildcards) {
            let property = wildcards[key],
                value = '';
            if (typeof property === 'string') value = getValue(property);
            if (typeof property === 'object') {
                if ('default' in property) value = itemtypeWildcard(property);
                if ('field' in property) value = regexWildcard(property);
            }
            table['%' + key] = value;
        }
        return table;
    },

    /**
     * Resolve one rule segment (no conditional braces) against the table.
     * Returns {str, complete}; complete is false if a wildcard was empty.
     */
    fillRule(rule, table, offset = 0) {
        if (rule === '') return { str: '', complete: true };

        let wildcards = this.findStrPos(rule, '%');
        let bars = this.findStrPos(rule, '|');
        let exclusive = '';
        let str = [];
        let complete = true;
        let excl_complete = true;
        let pos = 0;
        let last = -1;
        let lookup = '';
        let j = -1;

        for (let i = 0; i < bars.length; ++i) {
            pos = this.binaryArrayIndex(wildcards, bars[i]);
            if (pos - 1 < last || pos === 0) {
                Zotero.ZotFileLite.messages_error.push(Zotero.ZotFileLite.ZFgetString('renaming.errorFormat.left', [offset + bars[i]]));
            }
            if (wildcards[pos] > bars[i + 1] || pos === wildcards.length) {
                Zotero.ZotFileLite.messages_error.push(Zotero.ZotFileLite.ZFgetString('renaming.errorFormat.right', [offset + bars[i]]));
            }
            if (pos - last > 1) {
                if (!excl_complete) complete = false;
                excl_complete = false;
                if (exclusive !== '') {
                    str.push(exclusive);
                    exclusive = '';
                }
                for (j = last + 1; j < pos - 1; ++j) {
                    str.push(rule.substring(wildcards[j - 1] + 2, wildcards[j]));
                    lookup = table[rule.substr(wildcards[j], 2)];
                    if (lookup === '' || lookup === undefined || lookup === null) complete = false;
                    else str.push(lookup);
                }
                str.push(rule.substring(wildcards[j - 1] + 2, wildcards[j]));
            }
            lookup = table[rule.substr(wildcards[pos - 1], 2)];
            if (lookup === '' || lookup === undefined || lookup === null) excl_complete = excl_complete || false;
            else {
                exclusive = exclusive || lookup;
                excl_complete = true;
            }
            lookup = table[rule.substr(wildcards[pos], 2)];
            if (lookup === '' || lookup === undefined || lookup === null) excl_complete = excl_complete || false;
            else {
                exclusive = exclusive || lookup;
                excl_complete = true;
            }
            last = pos;
        }
        if (!excl_complete) complete = false;
        if (exclusive !== '') str.push(exclusive);

        for (j = last + 1; j < wildcards.length; ++j) {
            str.push(rule.substring(wildcards[j - 1] + 2, wildcards[j]));
            let wildcard = rule.substr(wildcards[j], 2);
            lookup = table[wildcard];
            if (lookup && Array.isArray(lookup)) {
                lookup = this.selectCollectionPath(lookup, table['%t']);
            }
            if (lookup === '' || lookup === undefined || lookup === null) complete = false;
            else str.push(lookup);
        }
        str.push(rule.substring(wildcards[j - 1] + 2));
        return { str: str.join(''), complete: complete };
    },

    /**
     * Ask the user which collection path to use for %c.
     */
    selectCollectionPath(collectionPaths, title) {
        if (collectionPaths.length === 0) return this.emptyCollectionPlaceholder;
        if (collectionPaths.length === 1) return collectionPaths[0];
        let prompts = Services.prompt;
        let selected = {};
        let message = Zotero.ZotFileLite.ZFgetString('renaming.selectCollectionPath');
        let result = prompts.select(null, title || 'zotfile-lite', message, collectionPaths.length, collectionPaths, selected);
        if (!result) {
            throw { name: 'UserAbortion', message: 'Batch rename canceled by user.' };
        }
        return collectionPaths[selected.value];
    },

    /**
     * Replace all wildcards in `rule` for `item`.
     * @param {Zotero.Item} item
     * @param {string} rule
     * @param {object} [table] reuse a precomputed wildcard table (batch renames)
     * @return {string}
     */
    replaceWildcard(item, rule, table, offset) {
        if (rule === '' || rule === undefined) return '';
        table = table || this.wildcardTable(item);
        offset = offset === undefined ? 0 : offset;

        let conditional = this.findOuterPairs(rule);
        let name = [];
        let last = -1;
        let res;
        let complete = true;

        for (let i = 0; i < conditional.length; ++i) {
            res = this.fillRule(rule.substring(last + 1, conditional[i].start), table, last + 1);
            complete = complete && res.complete;
            name.push(res.str);
            name.push(this.replaceWildcard(item, rule.substring(conditional[i].start + 1, conditional[i].end), table, conditional[i].start + 1));
            last = conditional[i].end;
        }
        res = this.fillRule(rule.substring(last + 1, rule.length), table, last + 1);
        complete = complete && res.complete;
        // inside a conditional group: drop the whole group if incomplete
        if (offset > 0 && !complete) return '';
        name.push(res.str);
        return name.join('');
    }
};
