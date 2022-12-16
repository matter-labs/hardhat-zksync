import type cbor from 'cbor';

import debug from 'debug';
import util from 'util';

interface MetadataDescription {
    solcVersion: string;
    metadataSectionSizeInBytes: number;
}

export const METADATA_LENGTH_SIZE = 2;
export const METADATA_PRESENT_SOLC_NOT_FOUND_VERSION_RANGE = '0.4.7 - 0.5.8';
export const METADATA_ABSENT_VERSION_RANGE = '<0.4.7';

const log = debug('hardhat:hardhat-etherscan:metadata');

export function inferSolcVersion(bytecode: Buffer): MetadataDescription {
    let solcMetadata;
    let metadataSectionSizeInBytes;
    try {
        const metadata = decodeSolcMetadata(bytecode);
        log(`Metadata decoded: ${util.inspect(metadata.decoded)}`);
        metadataSectionSizeInBytes = metadata.metadataSectionSizeInBytes;
        solcMetadata = metadata.decoded.solc;
    } catch {
        // The decoding failed. Unfortunately, our only option is to assume that this bytecode was emitted by an old version.
        // Technically, this bytecode could have been emitted by a compiler for another language altogether.

        log('Could not decode metadata.');
        return {
            metadataSectionSizeInBytes: 0,
            solcVersion: METADATA_ABSENT_VERSION_RANGE,
        };
    }

    if (solcMetadata instanceof Buffer) {
        if (solcMetadata.length === 3) {
            const [major, minor, patch] = solcMetadata;
            const solcVersion = `${major}.${minor}.${patch}`;
            log(`Solc version detected in bytecode: ${solcVersion}`);
            return { metadataSectionSizeInBytes, solcVersion };
        }
        log(`Found solc version field with ${solcMetadata.length} elements instead of three!`);
    }

    // The embedded metadata was successfully decoded but there was no solc version in it.
    log(`Could not detect solidity version in metadata.`);
    return {
        metadataSectionSizeInBytes,
        solcVersion: METADATA_PRESENT_SOLC_NOT_FOUND_VERSION_RANGE,
    };
}

export function decodeSolcMetadata(bytecode: Buffer) {
    const metadataSectionLength = getSolcMetadataSectionLength(bytecode);
    // The metadata and its length are in the last few bytes.
    const metadataPayload = bytecode.slice(-metadataSectionLength, -METADATA_LENGTH_SIZE);

    log(`Read metadata length ${metadataSectionLength}`);

    const lastMetadataBytes = metadataPayload.slice(-100);
    log(`Last ${lastMetadataBytes.length} bytes of metadata: ${lastMetadataBytes.toString('hex')}`);

    const { decodeFirstSync }: typeof cbor = require('cbor');
    // The documentation for decodeFirst mentions the `required` option even though
    // the type information is missing it.
    // See http://hildjj.github.io/node-cbor/Decoder.html#.decodeFirst
    const options: cbor.DecoderOptions = { required: true } as any;
    const decoded = decodeFirstSync(metadataPayload, options);
    return {
        decoded,
        metadataSectionSizeInBytes: metadataSectionLength,
    };
}

export function getSolcMetadataSectionLength(bytecode: Buffer) {
    return bytecode.slice(-METADATA_LENGTH_SIZE).readUInt16BE(0) + METADATA_LENGTH_SIZE;
}
