import {
    DockerBadGatewayError,
    DockerHubConnectionError,
    DockerNotRunningError,
    DockerServerError,
    HardhatDocker,
    Image,
    ImageDoesntExistError,
} from '@nomiclabs/hardhat-docker';
import { CompilerOptions } from '../types';
import Docker, { ContainerCreateOptions } from 'dockerode';
import { pluginError } from '../utils';
import { Writable } from 'stream';
import path from 'path';
import chalk from 'chalk';

async function runZksolcContainer(docker: Docker, image: Image, paths: CompilerOptions) {
    const relativeSourcesPath = path.relative(process.cwd(), paths.sourcesPath!);

    const createOptions: ContainerCreateOptions = {
        Tty: false,
        AttachStdin: true,
        OpenStdin: true,
        StdinOnce: true,
        HostConfig: {
            AutoRemove: true,
            Binds: [`${paths.sourcesPath!}:/${relativeSourcesPath}`],
        },
        Cmd: ['zkvyper', '-f', 'combined_json', ...paths.inputPaths.map((p) => path.relative(process.cwd(), p))],
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
        stdout: true,
        stderr: true,
        hijack: true,
    });

    dockerStream.pipe(stream);
    await container.start();
    dockerStream.end();
    await container.wait();

    const compilerOutput = output.toString('utf8');
    try {
        return JSON.parse(compilerOutput);
    } catch {
        throw pluginError(compilerOutput);
    }
}

export function dockerImage(imageName?: string, imageTag?: string): Image {
    if (!imageName) {
        throw pluginError('Docker source was chosen but no image was specified');
    }

    return {
        repository: imageName,
        tag: imageTag || 'latest',
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
        console.info(chalk.yellow(`Pulling Docker image ${HardhatDocker.imageToRepoTag(image)}...`));

        await docker.pullImage(image);

        console.info(chalk.green(`Image pulled`));
    } else {
        await checkForImageUpdates(docker, image);
    }
}

async function checkForImageUpdates(docker: HardhatDocker, image: Image) {
    if (!(await docker.isImageUpToDate(image))) {
        console.info(chalk.yellow(`Updating Docker image ${HardhatDocker.imageToRepoTag(image)}...`));

        await docker.pullImage(image);

        console.info(chalk.green(`Image updated`));
    }
}

export async function compileWithDocker(paths: CompilerOptions, docker: HardhatDocker, image: Image) {
    // @ts-ignore
    const dockerInstance: Docker = docker._docker;
    return await handleCommonErrors(runZksolcContainer(dockerInstance, image, paths));
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
                    'Make sure you chose a valid zkvyper version.'
            );
        }

        throw error;
    }
}
