export declare class AsyncQueue {
    private tail;
    private delayedOpCount;
    failure: Error;
    private operationInProgress;
    /**
     * Adds a new operation to the queue. Returns a promise that will be resolved
     * when the promise returned by the new operation is (with its value).
     *
     * Can optionally specify a delay to wait before queuing the operation.
     */
    schedule<T>(op: () => Promise<T>, delay?: number): Promise<T>;
    private scheduleInternal<T>(op);
    /**
     * Verifies there's an operation currently in-progress on the AsyncQueue.
     * Unfortunately we can't verify that the running code is in the promise chain
     * of that operation, so this isn't a foolproof check, but it should be enough
     * to catch some bugs.
     */
    verifyOperationInProgress(): void;
    drain(): Promise<void>;
}
