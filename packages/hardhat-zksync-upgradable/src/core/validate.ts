import { getVersion, SolcOutput } from '@openzeppelin/upgrades-core';
import { SrcDecoder } from '@openzeppelin/upgrades-core/src/src-decoder';

import { findAll } from 'solidity-ast/utils';
import { Node } from 'solidity-ast/node';
import type { ContractDefinition } from 'solidity-ast';

export function validate(solcOutput: SolcOutput, decodeSrc: SrcDecoder, solcVersion?: string): any {
    const validation: any = {};
    const fromId: Record<number, string> = {};
    const inheritIds: Record<string, number[]> = {};
    const libraryIds: Record<string, number[]> = {};

    for (const source in solcOutput.contracts) {
        for (const contractName in solcOutput.contracts[source]) {
            const bytecode = solcOutput.contracts[source][contractName].evm.bytecode;

            // if bytecode does not exist, it means the contract is abstract so skip it
            if (bytecode === null) {
                continue;
            }

            const version = bytecode.object === '' ? undefined : getVersion(bytecode.object);

            validation[getFullyQualifiedName(source, contractName)] = {
                src: contractName,
                version,
                inherit: [],
                libraries: [],
                methods: [],
                errors: [],
                layout: {
                    storage: [],
                    types: {},
                },
                solcVersion,
            };
        }

        for (const contractDef of findAll('ContractDefinition', solcOutput.sources[source].ast)) {
            const key = getFullyQualifiedName(source, contractDef.name);

            fromId[contractDef.id] = key;
            const bytecode = solcOutput.contracts[source][contractDef.name]?.evm.bytecode;

            if (key in validation && bytecode !== undefined) {
                validation[key].src = decodeSrc(contractDef);
                validation[key].errors = [...getConstructorErrors(contractDef, decodeSrc)];
            }
        }
    }

    for (const key in inheritIds) {
        validation[key].inherit = inheritIds[key].map((id) => fromId[id]);
    }

    for (const key in libraryIds) {
        validation[key].libraries = libraryIds[key].map((id) => fromId[id]);
    }

    return validation;
}

function* getConstructorErrors(contractDef: ContractDefinition, decodeSrc: SrcDecoder): Generator<any> {
    for (const fnDef of findAll('FunctionDefinition', contractDef, (node) => skipCheck('constructor', node))) {
        if (fnDef.kind === 'constructor' && ((fnDef.body?.statements?.length ?? 0) > 0 || fnDef.modifiers.length > 0)) {
            yield {
                kind: 'constructor',
                contract: contractDef.name,
                src: decodeSrc(fnDef),
            };
        }
    }
}

function getFullyQualifiedName(source: string, contractName: string) {
    return `${source}:${contractName}`;
}

function skipCheck(error: string, node: Node): boolean {
    return getAllowed(node).includes(error);
}

function getAllowed(node: Node): string[] {
    if ('documentation' in node) {
        const doc = typeof node.documentation === 'string' ? node.documentation : node.documentation?.text ?? '';

        const result: string[] = [];
        for (const { groups } of execall(
            /^\s*(?:@(?<title>\w+)(?::(?<tag>[a-z][a-z-]*))? )?(?<args>(?:(?!^\s@\w+)[^])*)/m,
            doc
        )) {
            if (groups && groups.title === 'custom' && groups.tag === 'oz-upgrades-unsafe-allow') {
                result.push(...groups.args.split(/\s+/));
            }
        }

        result.forEach((arg) => {
            if (!(errorKinds as readonly string[]).includes(arg)) {
                throw new Error(`NatSpec: oz-upgrades-unsafe-allow argument not recognized: ${arg}`);
            }
        });

        return result;
    } else {
        return [];
    }
}

function* execall(re: RegExp, text: string) {
    re = new RegExp(re, re.flags + (re.sticky ? '' : 'y'));
    while (true) {
        const match = re.exec(text);
        if (match && match[0] !== '') {
            yield match;
        } else {
            break;
        }
    }
}

const errorKinds = [
    'state-variable-assignment',
    'state-variable-immutable',
    'external-library-linking',
    'struct-definition',
    'enum-definition',
    'constructor',
    'delegatecall',
    'selfdestruct',
    'missing-public-upgradeto',
] as const;
