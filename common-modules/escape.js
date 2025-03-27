module.exports = function escapeRegExp(text) {
    if (!text) return undefined;
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

