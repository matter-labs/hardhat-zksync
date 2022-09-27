const config = require('../../common.config').default;

config.zksolc.settings = {
    libraries: {
        'contracts/Foo.sol': {
            'Foo': '0x0123456789abcdef0123456789abcdef01234567'
        }
    }
}

module.exports = config;
