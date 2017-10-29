/**
 * @coreapi
 * @module transition
 */ /** for typedoc */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var common_1 = require("../common/common");
var strings_1 = require("../common/strings");
var hof_1 = require("../common/hof");
var RejectType;
(function (RejectType) {
    RejectType[RejectType["SUPERSEDED"] = 2] = "SUPERSEDED";
    RejectType[RejectType["ABORTED"] = 3] = "ABORTED";
    RejectType[RejectType["INVALID"] = 4] = "INVALID";
    RejectType[RejectType["IGNORED"] = 5] = "IGNORED";
    RejectType[RejectType["ERROR"] = 6] = "ERROR";
})(RejectType = exports.RejectType || (exports.RejectType = {}));
/** @hidden */ var id = 0;
var Rejection = /** @class */ (function () {
    function Rejection(type, message, detail) {
        this.$id = id++;
        this.type = type;
        this.message = message;
        this.detail = detail;
    }
    Rejection.prototype.toString = function () {
        var detailString = function (d) {
            return d && d.toString !== Object.prototype.toString ? d.toString() : strings_1.stringify(d);
        };
        var detail = detailString(this.detail);
        var _a = this, $id = _a.$id, type = _a.type, message = _a.message;
        return "Transition Rejection($id: " + $id + " type: " + type + ", message: " + message + ", detail: " + detail + ")";
    };
    Rejection.prototype.toPromise = function () {
        return common_1.extend(common_1.silentRejection(this), { _transitionRejection: this });
    };
    /** Returns true if the obj is a rejected promise created from the `asPromise` factory */
    Rejection.isRejectionPromise = function (obj) {
        return obj && (typeof obj.then === 'function') && hof_1.is(Rejection)(obj._transitionRejection);
    };
    /** Returns a Rejection due to transition superseded */
    Rejection.superseded = function (detail, options) {
        var message = "The transition has been superseded by a different transition";
        var rejection = new Rejection(RejectType.SUPERSEDED, message, detail);
        if (options && options.redirected) {
            rejection.redirected = true;
        }
        return rejection;
    };
    /** Returns a Rejection due to redirected transition */
    Rejection.redirected = function (detail) {
        return Rejection.superseded(detail, { redirected: true });
    };
    /** Returns a Rejection due to invalid transition */
    Rejection.invalid = function (detail) {
        var message = "This transition is invalid";
        return new Rejection(RejectType.INVALID, message, detail);
    };
    /** Returns a Rejection due to ignored transition */
    Rejection.ignored = function (detail) {
        var message = "The transition was ignored";
        return new Rejection(RejectType.IGNORED, message, detail);
    };
    /** Returns a Rejection due to aborted transition */
    Rejection.aborted = function (detail) {
        var message = "The transition has been aborted";
        return new Rejection(RejectType.ABORTED, message, detail);
    };
    /** Returns a Rejection due to aborted transition */
    Rejection.errored = function (detail) {
        var message = "The transition errored";
        return new Rejection(RejectType.ERROR, message, detail);
    };
    /**
     * Returns a Rejection
     *
     * Normalizes a value as a Rejection.
     * If the value is already a Rejection, returns it.
     * Otherwise, wraps and returns the value as a Rejection (Rejection type: ERROR).
     *
     * @returns `detail` if it is already a `Rejection`, else returns an ERROR Rejection.
     */
    Rejection.normalize = function (detail) {
        return hof_1.is(Rejection)(detail) ? detail : Rejection.errored(detail);
    };
    return Rejection;
}());
exports.Rejection = Rejection;
//# sourceMappingURL=rejectFactory.js.map