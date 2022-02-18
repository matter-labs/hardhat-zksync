import {
    DockerBadGatewayError,
    DockerHubConnectionError,
    DockerNotRunningError,
    DockerServerError,
    HardhatDocker,
    Image,
    ImageDoesntExistError,
} from '@nomiclabs/hardhat-docker';
import Docker, { ContainerCreateOptions } from 'dockerode';
import { CompilerInput } from 'hardhat/types';
import { ZkSolcConfig } from '../types';
import { pluginError } from '../utils';
import { Writable } from 'stream';

async function runZksolcContainer(docker: Docker, image: Image, command: string[], input: string) {
    const createOptions: ContainerCreateOptions = {
        Tty: false,
        AttachStdin: true,
        OpenStdin: true,
        StdinOnce: true,
        HostConfig: {
            AutoRemove: true,
        },
        Cmd: command,
        Image: HardhatDocker.imageToRepoTag(image),
    };

    const container = await docker.createContainer(createOptions);

    let output = Buffer.from('');
    let chunk = Buffer.from('');
    const stream = new Writable({
        write: function (incoming: Buffer, _encoding, next) {
            // Please refer to the 'Stream format' chapter at
            // https://docs.docker.com/engine/api/v1.37/#operation/ContainerAttach
            // to understand the details of this implementation.
            chunk = Buffer.concat([chunk, incoming]);
            let size = chunk.readUInt32BE(4);
            while (chunk.byteLength >= 8 + size) {
                output = Buffer.concat([output, chunk.slice(8, 8 + size)]);
                chunk = chunk.slice(8 + size);
                if (chunk.byteLength >= 8) {
                    size = chunk.readUInt32BE(4);
                }
            }
            next();
        },
    });

    const dockerStream = await container.attach({
        stream: true,
        stdin: true,
        stdout: true,
        stderr: true,
        hijack: true,
    });

    dockerStream.pipe(stream);
    await container.start();
    dockerStream.end(input);
    await container.wait();

    const compilerOutput = output.toString('utf8');
    try {
        return JSON.parse(compilerOutput);
    } catch {
        throw pluginError(compilerOutput);
    }
}

// Notice: contents of this file were mostly copy-pasted from the official Hardhat Vyper plugin
// https://github.com/nomiclabs/hardhat/tree/master/packages/hardhat-vyper

export function dockerImage(imageName?: string): Image {
    if (!imageName) {
        throw pluginError('Docker source was chosen but no image was specified');
    }

    return {
        repository: imageName,
        tag: 'latest',
    };
}

export async function validateDockerIsInstalled() {
    if (!(await HardhatDocker.isInstalled())) {
        throw pluginError(
            'Docker Desktop is not installed.\n' +
                'Please install it by following the instructions on https://www.docker.com/get-started'
        );
    }
}

export async function createDocker(): Promise<HardhatDocker> {
    return await handleCommonErrors(HardhatDocker.create());
}

export async function pullImageIfNecessary(docker: HardhatDocker, image: Image) {
    await handleCommonErrors(pullImageIfNecessaryInner(docker, image));
}

async function pullImageIfNecessaryInner(docker: HardhatDocker, image: Image) {
    if (!(await docker.hasPulledImage(image))) {
        console.log(`Pulling Docker image ${HardhatDocker.imageToRepoTag(image)}...`);

        await docker.pullImage(image);

        console.log(`Image pulled`);
    } else {
        await checkForImageUpdates(docker, image);
    }
}

async function checkForImageUpdates(docker: HardhatDocker, image: Image) {
    if (!(await docker.isImageUpToDate(image))) {
        console.log(`Updating Docker image ${HardhatDocker.imageToRepoTag(image)}...`);

        await docker.pullImage(image);

        console.log(`Image updated`);
    }
}

export async function compileWithDocker(
    input: CompilerInput,
    docker: HardhatDocker,
    image: Image,
    config: ZkSolcConfig
): Promise<any> {
    const command = ['zksolc', '--standard-json'];
    if (config?.settings?.optimizer?.enabled) {
        command.push('--optimize');
    }

    // @ts-ignore
    const dockerInstance: Docker = docker._docker;
    return await handleCommonErrors(runZksolcContainer(dockerInstance, image, command, JSON.stringify(input)));
}

async function handleCommonErrors<T>(promise: Promise<T>): Promise<T> {
    try {
        return await promise;
    } catch (error) {
        if (error instanceof DockerNotRunningError || error instanceof DockerBadGatewayError) {
            throw pluginError(
                'Docker Desktop is not running.\nPlease open it and wait until it finishes booting.',
                error
            );
        }

        if (error instanceof DockerHubConnectionError) {
            throw pluginError('Error connecting to Docker Hub.\nPlease check your internet connection.', error);
        }

        if (error instanceof DockerServerError) {
            throw pluginError('Docker error', error);
        }

        if (error instanceof ImageDoesntExistError) {
            throw pluginError(
                `Docker image ${HardhatDocker.imageToRepoTag(error.image)} doesn't exist.\n` +
                    'Make sure you chose a valid zksolc version.'
            );
        }

        throw error;
    }
}
