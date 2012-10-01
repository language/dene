/**
 * Returns an array of valid symbols contained within an alphabet.
 *
 * @param {Array} alphabet
 * @returns {Array}
 */

exports.getSymbols = function (alphabet) {
    var arr = [];
    for (var i = 0, len = alphabet.length; i < len; i++) {
        arr.push(alphabet[i][0]);
    }
    return arr;
};


/**
 * Splits a string into an array of valid symbols. Attempts to match the longest
 * symbol possible before moving onto the next.
 *
 * @param {Array} alphabet
 * @param {String} str
 * @returns {Array}
 */

exports.splitSymbols = function (alphabet, str) {
    var symbols = [];
    var reference = exports.getSymbols(alphabet);
    var buffer = '';

    function validSymbolPart(str) {
        for (var i = 0, len = reference.length; i < len; i++) {
            if (reference[i].substr(0, str.length) === str) {
                return true;
            }
        }
        return false;
    }

    for (var i = 0, len = str.length; i < len; i++) {
        var ch = str[i];
        if (validSymbolPart(buffer + ch)) {
            buffer += ch;
        }
        else {
            if (buffer.length) {
                // buffered symbol is complete
                symbols.push(buffer);
                buffer = '';
            }
            if (validSymbolPart(ch)) {
                buffer = ch;
            }
            else {
                throw new Error('Unknown symbol "' + ch + '" in "' + str + '"');
            }
        }
    }
    if (buffer.length) {
        symbols.push(buffer);
    }
    return symbols;
};

/**
 * Prepend '0' until the string is at least 'min' length. Strings greater or
 * equal to min length are unaltered.
 *
 * @param {Number} min
 * @param {String} str
 * @returns {String}
 */

exports.zeroPad = function (min, str) {
    while (str.length < min) {
        str = '0' + str;
    }
    return str;
};

/**
 * Returns the alphabet data for a symbol, throws an error if symbol not found
 *
 * @param {Array} alphabet
 * @param {String} symbol
 * @returns {Array}
 */

exports.getSymbolInfo = function (alphabet, symbol) {
    for (var i = 0, len = alphabet.length; i < len; i++) {
        if (alphabet[i][0] === symbol) {
            return alphabet[i];
        }
    }
    throw new Error('Unknown symbol: "' + symbol + '"');
};

/**
 * Returns the base sort value for a given symbol in an alphabet.
 *
 * @param {Array} alphabet
 * @param {String} symbol
 * @returns {Number}
 */

exports.getSortBase = function (alphabet, symbol) {
    return exports.getSymbolInfo(alphabet, symbol)[2];
};

/**
 * Creates a string, which when used as a key in a CouchDB view will sort
 * according to the rules of the provided alphabet. This string does not
 * retain the meaning of the original, and should be used as a sort-key only.
 *
 * @param {Array} alphabet
 * @param {String} str
 * @returns {String}
 */

exports.sortValue = function (alphabet, str) {
    var symbols = exports.splitSymbols(alphabet, str);
    var value = '';

    for (var i = 0, len = symbols.length; i < len; i++) {
        var sortbase = exports.getSortBase(alphabet, symbols[i]);
        value += exports.zeroPad(2, sortbase);
    }
    return value;
};


/**
 * Replace winmac characters with proper symbols from alphabet
 *
 * @param {Array} alphabet
 * @param {String} str
 * @returns {String}
 */

exports.replaceWinmac = function (alphabet, str) {
    for (var i = 0, len = alphabet.length; i < len; i++) {
        if (alphabet[i][1]) {
            var re = new RegExp(alphabet[i][1], 'gm');
            str = str.replace(re, alphabet[i][0]);
        }
    }
    return str;
};


/**
 * Split symbols and convert to given case value using the provided alphabet
 *
 * @param {Array} alphabet
 * @param {String} str
 * @returns {String}
 */

exports.setCase = function (alphabet, str, caseval) {
    var symbols = exports.splitSymbols(alphabet, str);

    var newcased = symbols.map(function (s) {
        var info = exports.getSymbolInfo(alphabet, s);
        var baseSort = info[2];
        var accentSort = info[3];

        var newcase = alphabet.filter(function (s) {
            if (s[2] === baseSort && s[3] == accentSort) {
                if (s[4] === caseval || s[4] === -1) {
                    return true;
                }
            }
            return false;
        });

        if (!newcase.length) {
            throw new Error('No matching character found for "' + s[0] + '"');
        }
        else if (newcase.length > 1) {
            throw new Error(
                'Mulitple matching characters found for "' + s[0] + '"'
            );
        }
        return newcase[0][0];
    });
    return newcased.join('');
};


/**
 * Split symbols and convert to uppercase value using the provided alphabet
 *
 * @param {Array} alphabet
 * @param {String} str
 * @returns {String}
 */

exports.toUpperCase = function (alphabet, str) {
    return exports.setCase(alphabet, str, 1);
};


/**
 * Split symbols and convert to lowercase value using the provided alphabet
 *
 * @param {Array} alphabet
 * @param {String} str
 * @returns {String}
 */

exports.toLowerCase = function (alphabet, str) {
    return exports.setCase(alphabet, str, 0);
};

/**
 * Remove the accents from a symbol object
 *
 * @param {Array} alphabet
 * @param {Object} symbol
 * @returns {String}
 */

exports.removeSymbolAccent = function (alphabet, symbol) {
    if (symbol[3] === 0) {
        return symbol[0];
    }
    var sortbase = symbol[2];
    var sortcase = symbol[4];
    for (var i = 0, len = alphabet.length; i < len; i++) {
        var s = alphabet[i];
        if (s[2] === sortbase && s[3] === 0 && s[4] === sortcase) {
            return s[0];
        }
    }
    throw new Error(
        'No matching symbol without accents for "' + symbol[0] + '"'
    );
};

/**
 * Removes accents from alphabet symbols in a string.
 *
 * @param {Array} alphabet
 * @param {String} str
 * @returns {String}
 */

exports.stripAccents = function (alphabet, str) {
    var symbols = exports.splitSymbols(alphabet, str);
    var result = '';
    for (var i = 0, len = symbols.length; i < len; i++) {
        var s = exports.getSymbolInfo(alphabet, symbols[i]);
        result += exports.removeSymbolAccent(alphabet, s);
    }
    return result;
};
