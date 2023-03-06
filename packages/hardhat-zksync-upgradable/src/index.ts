import '@openzeppelin/hardhat-upgrades';

import { extendEnvironment, subtask, task, types } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import './type-extensions';

import { SolcInput, SolcOutput } from '@openzeppelin/upgrades-core/src/solc-api';
import { SrcDecoder } from '@openzeppelin/upgrades-core/src/src-decoder';

import { TASK_COMPILE_SOLIDITY_COMPILE, TASK_COMPILE_SOLIDITY_COMPILE_SOLC } from 'hardhat/builtin-tasks/task-names';
import type { ContractDefinition } from 'solidity-ast';

// import { extractStorageLayout } from '@openzeppelin/upgrades-core/src/storage/extract';
// import { getFunctionSignature } from '@openzeppelin/upgrades-core/src/utils/function';

extendEnvironment((hre: HardhatRuntimeEnvironment) => {});

//TODO: move to interfaces file
interface RunCompilerArgs {
    input: SolcInput;
    solcVersion: string;
}

subtask(TASK_COMPILE_SOLIDITY_COMPILE, async (args: RunCompilerArgs, hre, runSuper) => {
    const { solcInputOutputDecoder } = await import('@openzeppelin/upgrades-core');
    const { writeValidations } = await import('./validations');

    // TODO: patch input
    const { output, solcBuild } = await hre.run(TASK_COMPILE_SOLIDITY_COMPILE_SOLC, args);

    if (isFullSolcOutput(output)) {
        const decodeSrc = solcInputOutputDecoder(args.input, output);
        const validations = validate(output, decodeSrc, args.solcVersion);
        await writeValidations(hre, validations);
    }

    return { output, solcBuild };
});

// TODO: Move to somewhere
type RecursivePartial<T> = { [k in keyof T]?: RecursivePartial<T[k]> };

type MaybeSolcOutput = RecursivePartial<SolcOutput>;

export function isFullSolcOutput(output: MaybeSolcOutput | undefined): boolean {
    if (output?.contracts == undefined || output?.sources == undefined) {
        return false;
    }

    for (const file of Object.values(output.contracts)) {
        if (file == undefined) {
            return false;
        }
        for (const contract of Object.values(file)) {
            if (contract?.evm?.bytecode == undefined) {
                return false;
            }
        }
    }

    for (const file of Object.values(output.sources)) {
        if (file?.ast == undefined || file?.id == undefined) {
            return false;
        }
    }

    return true;
}

//

// import { astDereferencer } from '@openzeppelin/upgrades-core/src/ast-dereferencer';
import { Version, getVersion } from './version';

import { ValidationRunData, ValidationError } from '@openzeppelin/upgrades-core/src/validate/run';

import { isNodeType, findAll } from 'solidity-ast/utils';
import { Node } from 'solidity-ast/node';

function getFullyQualifiedName(source: string, contractName: string) {
    return `${source}:${contractName}`;
}

export function validate(solcOutput: SolcOutput, decodeSrc: SrcDecoder, solcVersion?: string): ValidationRunData {
    const validation: ValidationRunData = {};
    const fromId: Record<number, string> = {};
    const inheritIds: Record<string, number[]> = {};
    const libraryIds: Record<string, number[]> = {};

    // const deref = astDereferencer(solcOutput);

    for (const source in solcOutput.contracts) {
        for (const contractName in solcOutput.contracts[source]) {
            const bytecode = solcOutput.contracts[source][contractName].evm.bytecode;
            const version = bytecode.object === '' ? undefined : getVersion(bytecode.object);
            // const linkReferences = extractLinkReferences(bytecode);
            const linkReferences: never[] = [];

            validation[getFullyQualifiedName(source, contractName)] = {
                src: contractName,
                version,
                inherit: [],
                libraries: [],
                methods: [],
                linkReferences,
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

            // May be undefined in case of duplicate contract names in Truffle
            const bytecode = solcOutput.contracts[source][contractDef.name]?.evm.bytecode;

            if (key in validation && bytecode !== undefined) {
                // inheritIds[key] = contractDef.linearizedBaseContracts.slice(1);
                // libraryIds[key] = getReferencedLibraryIds(contractDef);

                validation[key].src = decodeSrc(contractDef);
                validation[key].errors = [
                    ...getConstructorErrors(contractDef, decodeSrc),
                    // ...getOpcodeErrors(contractDef, decodeSrc),
                    // ...getStateVariableErrors(contractDef, decodeSrc),
                    // TODO: add linked libraries support
                    // https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/52
                    // ...getLinkingErrors(contractDef, bytecode),
                ];

                // TODO: Check if this is needed
                // validation[key].layout = extractStorageLayout(
                //     contractDef,
                //     decodeSrc,
                //     deref,
                //     solcOutput.contracts[source][contractDef.name].storageLayout
                // );
                // validation[key].methods = [...findAll('FunctionDefinition', contractDef)]
                //     .filter((fnDef) => ['external', 'public'].includes(fnDef.visibility))
                //     .map((fnDef) => getFunctionSignature(fnDef, deref));
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

function* getConstructorErrors(contractDef: ContractDefinition, decodeSrc: SrcDecoder): Generator<ValidationError> {
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

function skipCheck(error: string, node: Node): boolean {
    return getAllowed(node).includes(error);
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
