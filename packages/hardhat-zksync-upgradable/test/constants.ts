export const authorizationErrors = {
    CALLER_NOT_OWNER: 'Ownable: caller is not the owner',
    NO_PROXY_ADMIN_FOUND: 'No ProxyAdmin was found in the network manifest',
    WRONG_PROXY_ADMIN: 'Proxy admin is not the one registered in the network manifest',
};

export const standaloneValidationErrors = {
    USE_OF_DELEGATE_CALL: 'Use of delegatecall is not allowed',
    STATE_VARIABLE_ASSIGNMENT: 'Variable `value` is assigned an initial value',
    STATE_VARIABLE_IMMUTABLE: 'Variable `secondValue` is immutable',
    MISSING_PUBLIC_UPGRADE_TO:'Implementation is missing a public `upgradeTo(address)` or `upgradeToAndCall(address,bytes)` function' ,
};

export const storageLayoutErrors = {
    INCOMPATIBLE_STORAGE_LAYOUT: 'New storage layout is incompatible',
    INSERTED_VARIABLE: 'Inserted `insertedValue`',
    RENAMED_VARIABLE: 'Renamed `thirdValue` to `renamedValue`',
    DELETED_VARIABLE: 'Deleted `fifthValue`',
    CHANGE_VARIABLE_TYPE: 'Upgraded `secondValue` to an incompatible type',
    STORAGE_GAP_SIZE: 'Layout changed for `__gap`',
};

export const TEST_ADDRESS = '0x8e1DC7E4Bb15927E76a854a92Bf8053761501fdC';
