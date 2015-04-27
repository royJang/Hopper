var ip = exports,
    os = require('os');

ip.isPrivate = function isPrivate(addr) {
    return addr.match(/^10\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/) != null ||
        addr.match(/^192\.168\.([0-9]{1,3})\.([0-9]{1,3})/) != null ||
        addr.match(
            /^172\.(1[6-9]|2\d|30|31)\.([0-9]{1,3})\.([0-9]{1,3})/) != null ||
        addr.match(/^127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/) != null ||
        addr.match(/^169\.254\.([0-9]{1,3})\.([0-9]{1,3})/) != null ||
        addr.match(/^fc00:/) != null || addr.match(/^fe80:/) != null ||
        addr.match(/^::1$/) != null || addr.match(/^::$/) != null;
};

ip.isLoopback = function isLoopback(addr) {
    return /^127\.0\.0\.1$/.test(addr)
        || /^fe80::1$/.test(addr)
        || /^::1$/.test(addr)
        || /^::$/.test(addr);
};

ip.loopback = function loopback(family) {

    family = _normalizeFamily(family);

    if (family !== 'ipv4' && family !== 'ipv6') {
        throw new Error('family must be ipv4 or ipv6');
    }

    return family === 'ipv4'
        ? '127.0.0.1'
        : 'fe80::1';
};

ip.address = function address(name, family) {
    var interfaces = os.networkInterfaces(),
        all;

    family = _normalizeFamily(family);

    if (name && !~['public', 'private'].indexOf(name)) {
        return interfaces[name].filter(function (details) {
            details.family = details.family.toLowerCase();
            return details.family === family;
        })[0].address;
    }

    var all = Object.keys(interfaces).map(function (nic) {

        var addresses = interfaces[nic].filter(function (details) {
            details.family = details.family.toLowerCase();
            if (details.family !== family || ip.isLoopback(details.address)) {
                return false;
            }
            else if (!name) {
                return true;
            }

            return name === 'public'
                ? !ip.isPrivate(details.address)
                : ip.isPrivate(details.address)
        });

        return addresses.length
            ? addresses[0].address
            : undefined;
    }).filter(Boolean);

    return !all.length
        ? ip.loopback(family)
        : all[0];
};

function _normalizeFamily(family) {
    return family ? family.toLowerCase() : 'ipv4';
}