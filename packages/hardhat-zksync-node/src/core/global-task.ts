import { Network } from 'hardhat/types';

export type ZKSyncTasksWithWrappedNode = typeof global & {
    _zkSyncTasksForWrapping: ZKSyncTasksForWrapping;
    _zkSyncNodeNetwork?: Network;
};

export class ZKSyncTasksForWrapping {
    public taskNames: string[] = [];

    constructor() {}

    public addTask(taskName: string) {
        this.taskNames.push(taskName);
    }
}
