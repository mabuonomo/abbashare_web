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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { assert } from '../util/assert';
import { Code, FirestoreError } from '../util/error';
import * as log from '../util/log';
import { ExponentialBackoff } from './backoff';
var LOG_TAG = 'PersistentStream';
var PersistentStreamState;
(function (PersistentStreamState) {
    /**
     * The streaming RPC is not running and there's no error condition.
     * Calling `start` will start the stream immediately without backoff.
     * While in this state isStarted will return false.
     */
    PersistentStreamState[PersistentStreamState["Initial"] = 0] = "Initial";
    /**
     * The stream is starting, and is waiting for an auth token to attach to
     * the initial request. While in this state, isStarted will return
     * true but isOpen will return false.
     */
    PersistentStreamState[PersistentStreamState["Auth"] = 1] = "Auth";
    /**
     * The streaming RPC is up and running. Requests and responses can flow
     * freely. Both isStarted and isOpen will return true.
     */
    PersistentStreamState[PersistentStreamState["Open"] = 2] = "Open";
    /**
     * The stream encountered an error. The next start attempt will back off.
     * While in this state isStarted() will return false.
     *
     */
    PersistentStreamState[PersistentStreamState["Error"] = 3] = "Error";
    /**
     * An in-between state after an error where the stream is waiting before
     * re-starting. After
     * waiting is complete, the stream will try to open. While in this
     * state isStarted() will return YES but isOpen will return false.
     */
    PersistentStreamState[PersistentStreamState["Backoff"] = 4] = "Backoff";
    /**
     * The stream has been explicitly stopped; no further events will be emitted.
     */
    PersistentStreamState[PersistentStreamState["Stopped"] = 5] = "Stopped";
})(PersistentStreamState || (PersistentStreamState = {}));
/**
 * Initial backoff time in milliseconds after an error.
 * Set to 1s according to https://cloud.google.com/apis/design/errors.
 */
var BACKOFF_INITIAL_DELAY_MS = 1000;
/** Maximum backoff time in milliseconds */
var BACKOFF_MAX_DELAY_MS = 60 * 1000;
var BACKOFF_FACTOR = 1.5;
/**
 * A PersistentStream is an abstract base class that represents a streaming RPC
 * to the Firestore backend. It's built on top of the connections own support
 * for streaming RPCs, and adds several critical features for our clients:
 *
 *   - Exponential backoff on failure
 *   - Authentication via CredentialsProvider
 *   - Dispatching all callbacks into the shared worker queue
 *
 * Subclasses of PersistentStream implement serialization of models to and
 * from the JSON representation of the protocol buffers for a specific
 * streaming RPC.
 *
 * ## Starting and Stopping
 *
 * Streaming RPCs are stateful and need to be `start`ed before messages can
 * be sent and received. The PersistentStream will call the onOpen function
 * of the listener once the stream is ready to accept requests.
 *
 * Should a `start` fail, PersistentStream will call the registered
 * onClose with a FirestoreError indicating what went wrong.
 *
 * A PersistentStream can be started and stopped repeatedly.
 *
 * Generic types:
 *  SendType: The type of the outgoing message of the underlying
 *    connection stream
 *  ReceiveType: The type of the incoming message of the underlying
 *    connection stream
 *  ListenerType: The type of the listener that will be used for callbacks
 */
var PersistentStream = /** @class */ (function () {
    function PersistentStream(queue, connection, credentialsProvider, listener, 
        // Used for faster retries in testing
        initialBackoffDelay) {
        this.queue = queue;
        this.connection = connection;
        this.credentialsProvider = credentialsProvider;
        this.stream = null;
        this.listener = null;
        this.backoff = new ExponentialBackoff(initialBackoffDelay ? initialBackoffDelay : BACKOFF_INITIAL_DELAY_MS, BACKOFF_FACTOR, BACKOFF_MAX_DELAY_MS);
        this.state = PersistentStreamState.Initial;
        this.listener = listener;
    }
    /**
     * Returns true if `start` has been called and no error has occurred. True
     * indicates the stream is open or in the process of opening (which
     * encompasses respecting backoff, getting auth tokens, and starting the
     * actual RPC). Use `isOpen` to determine if the stream is open and ready for
     * outbound requests.
     */
    PersistentStream.prototype.isStarted = function () {
        return (this.state === PersistentStreamState.Backoff ||
            this.state === PersistentStreamState.Auth ||
            this.state === PersistentStreamState.Open);
    };
    /**
     * Returns true if the underlying RPC is open (the openHandler has been
     * called) and the stream is ready for outbound requests.
     */
    PersistentStream.prototype.isOpen = function () {
        return this.state === PersistentStreamState.Open;
    };
    /**
     * Starts the RPC. Only allowed if isStarted returns false. The stream is
     * not immediately ready for use: onOpen will be invoked when the RPC is ready
     * for outbound requests, at which point isOpen will return true.
     *
     *  When start returns, isStarted will return true.
     */
    PersistentStream.prototype.start = function () {
        if (this.state === PersistentStreamState.Error) {
            this.performBackoff();
            return;
        }
        assert(this.state === PersistentStreamState.Initial, 'Already started');
        this.auth();
    };
    /**
     * Stops the RPC. This call is idempotent and allowed regardless of the
     * current isStarted state.
     *
     * When stop returns, isStarted and isOpen will both return false.
     */
    PersistentStream.prototype.stop = function () {
        // Prevent any possible future restart of this stream
        this.state = PersistentStreamState.Stopped;
        // Clear the listener to avoid bleeding of events from the underlying
        // streams
        this.listener = null;
        // Clean up the underlying stream because we are no longer interested in
        // events
        if (this.stream !== null) {
            this.stream.close();
            this.stream = null;
        }
    };
    /**
     * After an error the stream will usually back off on the next attempt to
     * start it. If the error warrants an immediate restart of the stream, the
     * sender can use this to indicate that the receiver should not back off.
     *
     * Each error will call the onClose function. That function can decide to
     * inhibit backoff if required.
     */
    PersistentStream.prototype.inhibitBackoff = function () {
        assert(!this.isStarted(), 'Can only inhibit backoff in a stopped state');
        this.state = PersistentStreamState.Initial;
        this.backoff.reset();
    };
    PersistentStream.prototype.auth = function () {
        var _this = this;
        assert(this.state === PersistentStreamState.Initial, 'Must be in initial state to auth');
        this.state = PersistentStreamState.Auth;
        this.credentialsProvider.getToken(/*forceRefresh=*/ false).then(function (token) {
            // Normally we'd have to schedule the callback on the AsyncQueue.
            // However, the following calls are safe to be called outside the
            // AsyncQueue since they don't chain asynchronous calls
            _this.startStream(token);
        }, function (error) {
            _this.queue.schedule(function () {
                if (_this.state !== PersistentStreamState.Stopped) {
                    // Stream can be stopped while waiting for authorization.
                    var rpcError = new FirestoreError(Code.UNKNOWN, 'Fetching auth token failed: ' + error.message);
                    return _this.handleStreamClose(rpcError);
                }
                else {
                    return Promise.resolve();
                }
            });
        });
    };
    PersistentStream.prototype.startStream = function (token) {
        var _this = this;
        if (this.state === PersistentStreamState.Stopped) {
            // Stream can be stopped while waiting for authorization.
            return;
        }
        assert(this.state === PersistentStreamState.Auth, 'Trying to start stream in a non-auth state');
        // Helper function to dispatch to AsyncQueue and make sure that any
        // close will seem instantaneous and events are prevented from being
        // raised after the close call
        var dispatchIfNotStopped = function (fn) {
            _this.queue.schedule(function () {
                // Only raise events if the listener has not changed
                if (_this.state !== PersistentStreamState.Stopped) {
                    return fn();
                }
                else {
                    return Promise.resolve();
                }
            });
        };
        // Only start stream if listener has not changed
        if (this.listener !== null) {
            this.stream = this.startRpc(token);
            this.stream.onOpen(function () {
                dispatchIfNotStopped(function () {
                    assert(_this.state === PersistentStreamState.Auth, 'Expected stream to be in state auth, but was ' + _this.state);
                    _this.state = PersistentStreamState.Open;
                    return _this.listener.onOpen();
                });
            });
            this.stream.onClose(function (error) {
                dispatchIfNotStopped(function () {
                    return _this.handleStreamClose(error);
                });
            });
            this.stream.onMessage(function (msg) {
                dispatchIfNotStopped(function () {
                    return _this.onMessage(msg);
                });
            });
        }
    };
    PersistentStream.prototype.performBackoff = function () {
        var _this = this;
        assert(this.state === PersistentStreamState.Error, 'Should only perform backoff in an error case');
        this.state = PersistentStreamState.Backoff;
        this.backoff.backoffAndWait().then(function () {
            // Backoff does not run on the AsyncQueue, so we need to reschedule to
            // make sure the queue blocks
            _this.queue.schedule(function () {
                if (_this.state === PersistentStreamState.Stopped) {
                    // Stream can be stopped while waiting for backoff to complete.
                    return Promise.resolve();
                }
                _this.state = PersistentStreamState.Initial;
                _this.start();
                assert(_this.isStarted(), 'PersistentStream should have started');
                return Promise.resolve();
            });
        });
    };
    PersistentStream.prototype.handleStreamClose = function (error) {
        assert(this.isStarted(), "Can't handle server close on non-started stream");
        log.debug(LOG_TAG, "close with error: " + error);
        this.stream = null;
        // In theory the stream could close cleanly, however, in our current model
        // we never expect this to happen because if we stop a stream ourselves,
        // this callback will never be called. To prevent cases where we retry
        // without a backoff accidentally, we set the stream to error in all cases.
        this.state = PersistentStreamState.Error;
        if (error && error.code === Code.RESOURCE_EXHAUSTED) {
            log.debug(LOG_TAG, 'Using maximum backoff delay to prevent overloading the backend.');
            this.backoff.resetToMax();
        }
        return this.listener.onClose(error);
    };
    return PersistentStream;
}());
export { PersistentStream };
/**
 * A PersistentStream that implements the Listen RPC.
 *
 * Once the Listen stream has called the openHandler, any number of listen and
 * unlisten calls calls can be sent to control what changes will be sent from
 * the server for ListenResponses.
 */
var PersistentListenStream = /** @class */ (function (_super) {
    __extends(PersistentListenStream, _super);
    function PersistentListenStream(databaseInfo, queue, connection, credentials, serializer, listener, initialBackoffDelay) {
        var _this = _super.call(this, queue, connection, credentials, listener, initialBackoffDelay) || this;
        _this.databaseInfo = databaseInfo;
        _this.serializer = serializer;
        return _this;
    }
    PersistentListenStream.prototype.startRpc = function (token) {
        return this.connection.openStream('Listen', token);
    };
    PersistentListenStream.prototype.onMessage = function (watchChangeProto) {
        // A successful response means the stream is healthy
        this.backoff.reset();
        var watchChange = this.serializer.fromWatchChange(watchChangeProto);
        var snapshot = this.serializer.versionFromListenResponse(watchChangeProto);
        return this.listener.onWatchChange(watchChange, snapshot);
    };
    /**
     * Registers interest in the results of the given query. If the query
     * includes a resumeToken it will be included in the request. Results that
     * affect the query will be streamed back as WatchChange messages that
     * reference the targetId.
     */
    PersistentListenStream.prototype.watch = function (queryData) {
        var request = {};
        request.database = this.serializer.encodedDatabaseId;
        request.addTarget = this.serializer.toTarget(queryData);
        var labels = this.serializer.toListenRequestLabels(queryData);
        if (labels) {
            request.labels = labels;
        }
        this.stream.send(request);
    };
    /**
     * Unregisters interest in the results of the query associated with the
     * given targetId.
     */
    PersistentListenStream.prototype.unwatch = function (targetId) {
        var request = {};
        request.database = this.serializer.encodedDatabaseId;
        request.removeTarget = targetId;
        this.stream.send(request);
    };
    return PersistentListenStream;
}(PersistentStream));
export { PersistentListenStream };
/**
 * A Stream that implements the Write RPC.
 *
 * The Write RPC requires the caller to maintain special streamToken
 * state in between calls, to help the server understand which responses the
 * client has processed by the time the next request is made. Every response
 * will contain a streamToken; this value must be passed to the next
 * request.
 *
 * After calling start() on this stream, the next request must be a handshake,
 * containing whatever streamToken is on hand. Once a response to this
 * request is received, all pending mutations may be submitted. When
 * submitting multiple batches of mutations at the same time, it's
 * okay to use the same streamToken for the calls to writeMutations.
 *
 * TODO(b/33271235): Use proto types
 */
var PersistentWriteStream = /** @class */ (function (_super) {
    __extends(PersistentWriteStream, _super);
    function PersistentWriteStream(databaseInfo, queue, connection, credentials, serializer, listener, initialBackoffDelay) {
        var _this = _super.call(this, queue, connection, credentials, listener, initialBackoffDelay) || this;
        _this.databaseInfo = databaseInfo;
        _this.serializer = serializer;
        _this.handshakeComplete_ = false;
        return _this;
    }
    Object.defineProperty(PersistentWriteStream.prototype, "handshakeComplete", {
        /**
         * Tracks whether or not a handshake has been successfully exchanged and
         * the stream is ready to accept mutations.
         */
        get: function () {
            return this.handshakeComplete_;
        },
        enumerable: true,
        configurable: true
    });
    // Override of PersistentStream.start
    PersistentWriteStream.prototype.start = function () {
        this.handshakeComplete_ = false;
        _super.prototype.start.call(this);
    };
    PersistentWriteStream.prototype.startRpc = function (token) {
        return this.connection.openStream('Write', token);
    };
    PersistentWriteStream.prototype.onMessage = function (responseProto) {
        // Always capture the last stream token.
        assert(!!responseProto.streamToken, 'Got a write response without a stream token');
        this.lastStreamToken = responseProto.streamToken;
        if (!this.handshakeComplete_) {
            // The first response is always the handshake response
            assert(!responseProto.writeResults || responseProto.writeResults.length === 0, 'Got mutation results for handshake');
            this.handshakeComplete_ = true;
            return this.listener.onHandshakeComplete();
        }
        else {
            // A successful first write response means the stream is healthy,
            // Note, that we could consider a successful handshake healthy, however,
            // the write itself might be causing an error we want to back off from.
            this.backoff.reset();
            var results = this.serializer.fromWriteResults(responseProto.writeResults);
            var commitVersion = this.serializer.fromVersion(responseProto.commitTime);
            return this.listener.onMutationResult(commitVersion, results);
        }
    };
    /**
     * Sends an initial streamToken to the server, performing the handshake
     * required to make the StreamingWrite RPC work. Subsequent
     * calls should wait until onHandshakeComplete was called.
     */
    PersistentWriteStream.prototype.writeHandshake = function () {
        assert(this.isOpen(), 'Writing handshake requires an opened stream');
        assert(!this.handshakeComplete_, 'Handshake already completed');
        // TODO(dimond): Support stream resumption. We intentionally do not set the
        // stream token on the handshake, ignoring any stream token we might have.
        var request = {};
        request.database = this.serializer.encodedDatabaseId;
        this.stream.send(request);
    };
    /** Sends a group of mutations to the Firestore backend to apply. */
    PersistentWriteStream.prototype.writeMutations = function (mutations) {
        var _this = this;
        assert(this.isOpen(), 'Writing mutations requires an opened stream');
        assert(this.handshakeComplete_, 'Handshake must be complete before writing mutations');
        assert(this.lastStreamToken.length > 0, 'Trying to write mutation without a token');
        var request = {
            // Protos are typed with string, but we support UInt8Array on Node
            // tslint:disable-next-line:no-any
            streamToken: this.lastStreamToken,
            writes: mutations.map(function (mutation) { return _this.serializer.toMutation(mutation); })
        };
        this.stream.send(request);
    };
    return PersistentWriteStream;
}(PersistentStream));
export { PersistentWriteStream };

//# sourceMappingURL=persistent_stream.js.map
