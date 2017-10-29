/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { assert, fail } from './assert';
import * as log from './log';
import { Deferred } from './promise';
var AsyncQueue = /** @class */ (function () {
    function AsyncQueue() {
        // The last promise in the queue.
        this.tail = Promise.resolve();
        // The number of ops that are queued to be run in the future (i.e. they had a
        // delay that has not yet elapsed).
        this.delayedOpCount = 0;
        // Flag set while there's an outstanding AsyncQueue operation, used for
        // assertion sanity-checks.
        this.operationInProgress = false;
    }
    /**
     * Adds a new operation to the queue. Returns a promise that will be resolved
     * when the promise returned by the new operation is (with its value).
     *
     * Can optionally specify a delay to wait before queuing the operation.
     */
    AsyncQueue.prototype.schedule = function (op, delay) {
        var _this = this;
        if (this.failure) {
            fail('AsyncQueue is already failed: ' + this.failure.message);
        }
        if ((delay || 0) > 0) {
            this.delayedOpCount++;
            var deferred_1 = new Deferred();
            setTimeout(function () {
                _this.scheduleInternal(function () {
                    return op().then(function (result) {
                        deferred_1.resolve(result);
                    });
                });
                _this.delayedOpCount--; // decrement once it's actually queued.
            }, delay);
            return deferred_1.promise;
        }
        else {
            return this.scheduleInternal(op);
        }
    };
    AsyncQueue.prototype.scheduleInternal = function (op) {
        var _this = this;
        this.tail = this.tail.then(function () {
            _this.operationInProgress = true;
            return op()
                .catch(function (error) {
                _this.failure = error;
                _this.operationInProgress = false;
                log.error('INTERNAL UNHANDLED ERROR: ', error.stack || error.message);
                throw error;
            })
                .then(function () {
                _this.operationInProgress = false;
            });
        });
        return this.tail;
    };
    /**
     * Verifies there's an operation currently in-progress on the AsyncQueue.
     * Unfortunately we can't verify that the running code is in the promise chain
     * of that operation, so this isn't a foolproof check, but it should be enough
     * to catch some bugs.
     */
    AsyncQueue.prototype.verifyOperationInProgress = function () {
        assert(this.operationInProgress, 'verifyOpInProgress() called when no op in progress on this queue.');
    };
    AsyncQueue.prototype.drain = function () {
        // TODO(mikelehen): This should perhaps also drain items that are queued to
        // run in the future (perhaps by artificially running them early), but since
        // no tests need that yet, I didn't bother for now.
        assert(this.delayedOpCount === 0, "draining doesn't handle delayed ops.");
        return this.schedule(function () { return Promise.resolve(undefined); });
    };
    return AsyncQueue;
}());
export { AsyncQueue };

//# sourceMappingURL=async_queue.js.map
