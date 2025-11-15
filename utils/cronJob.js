const ChatSession = require("../models/chatSession.model");

/**
 * Starts a cron-like job that completes ChatSession documents
 * which have status "accepted" and whose acceptedAt is older than thresholdHours.
 *
 * Usage:
 *   const cron = require("./utils/cronJob");
 *   const handle = cron.start({ intervalMinutes: 60, thresholdHours: 12 });
 *   // later: handle.stop();
 */

let _intervalHandle = null;

function _nowMinusHours(hours) {
    return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function _completeExpiredAcceptedSessions(thresholdHours) {
    try {
        const cutoff = _nowMinusHours(thresholdHours);

        // Adjust query field names if your model uses different fields
        const filter = {
            status: "accepted",
            acceptedAt: { $lte: cutoff }
        };

        const update = {
            $set: {
                status: "completed",
                completedAt: new Date()
            }
        };

        const result = await ChatSession.updateMany(filter, update).exec();
        const matched = result.n ?? result.matchedCount ?? 0;
        const modified = result.nModified ?? result.modifiedCount ?? 0;

        console.info(
            `[cronJob] Checked accepted sessions older than ${thresholdHours}h — matched: ${matched}, updated: ${modified}`
        );
    } catch (err) {
        console.error("[cronJob] Error completing expired accepted sessions:", err);
    }
}

/**
 * Start the cron job.
 * @param {Object} opts
 * @param {number} opts.intervalMinutes - how often to run the job (default 60)
 * @param {number} opts.thresholdHours - how old an accepted session must be to complete (default 12)
 * @returns {Object} handle with stop() method
 */
function start({ intervalMinutes = 60, thresholdHours = 12 } = {}) {
    if (_intervalHandle) {
        console.warn("[cronJob] Cron already running");
        return {
            stop: () => {}
        };
    }

    // run immediately once, then schedule
    _completeExpiredAcceptedSessions(thresholdHours).catch(() => {});

    _intervalHandle = setInterval(() => {
        _completeExpiredAcceptedSessions(thresholdHours).catch(() => {});
    }, Math.max(1, intervalMinutes) * 60 * 1000);

    console.info(
        `[cronJob] Started: checking every ${intervalMinutes} minute(s) for accepted sessions older than ${thresholdHours} hour(s)`
    );

    return {
        stop() {
            if (_intervalHandle) {
                clearInterval(_intervalHandle);
                _intervalHandle = null;
                console.info("[cronJob] Stopped");
            }
        }
    };
}


module.exports = {
    start
};