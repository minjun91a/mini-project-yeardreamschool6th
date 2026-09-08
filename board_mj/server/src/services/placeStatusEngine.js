const mongoose = require('mongoose');
const Place = require('../models/place');
const PlaceUpdate = require('../models/placeUpdate');
const QuickSignal = require('../models/quickSignal');
const Confirmation = require('../models/confirmation');
const PlaceStatus = require('../models/placeStatus');

const STATUS_VALUES = [
    'quiet',
    'normal',
    'busy'
];

const STATUS_ORDER = {
    quiet: 1,
    normal: 2,
    busy: 3
};

const EVIDENCE_WINDOW_MS = 6 * 60 * 60 * 1000;
const MIN_CONFIDENCE_FOR_STATUS = 0.25;
const MIN_SCORE_FOR_STATUS = 0.2;
const MIN_FRESHNESS_FOR_STATUS = 0.2;

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function roundScore(value) {
    return Math.round(clamp(value, 0, 1) * 1000) / 1000;
}

function roundWeight(value) {
    return Math.round(value * 1000) / 1000;
}

function getFreshnessScore(observedAt, now) {
    const observedTime = new Date(observedAt).getTime();
    const nowTime = new Date(now).getTime();

    if (!Number.isFinite(observedTime)) {
        return 0;
    }

    const ageMs = Math.max(0, nowTime - observedTime);

    if (ageMs > EVIDENCE_WINDOW_MS) {
        return 0;
    }

    return roundScore(1 - ageMs / EVIDENCE_WINDOW_MS);
}

function getEvidenceTrust(evidence, type) {
    const baseTrust = type === 'PlaceUpdate' ? 1 : 0.75;
    const verificationBonus = evidence.visitVerified ? 0.35 : 0;
    const detailBonus =
        type === 'PlaceUpdate' &&
        (evidence.content || evidence.images?.length > 0)
            ? 0.15
            : 0;

    return clamp(baseTrust + verificationBonus + detailBonus, 0, 1.4);
}

function getConfirmationTrust(confirmation) {
    return clamp(
        0.5 + (confirmation.visitVerified ? 0.25 : 0),
        0,
        1
    );
}

function createEmptyScores() {
    return {
        quiet: 0,
        normal: 0,
        busy: 0
    };
}

function getFreshestDate(dates) {
    const timestamps = dates
        .map((date) => new Date(date).getTime())
        .filter(Number.isFinite);

    if (timestamps.length === 0) {
        return null;
    }

    return new Date(Math.max(...timestamps));
}

function getTrend(previousStatus, status) {
    if (
        !previousStatus ||
        previousStatus === 'unknown' ||
        status === 'unknown'
    ) {
        return 'unknown';
    }

    if (previousStatus === status) {
        return 'stable';
    }

    return STATUS_ORDER[status] > STATUS_ORDER[previousStatus]
        ? 'rising'
        : 'falling';
}

function getChangeReason({
    previousPlaceStatus,
    status,
    hasStateEvidence,
    changedPenaltyTotal,
    hasConfirmation
}) {
    if (!hasStateEvidence) {
        return 'expired';
    }

    if (status === 'unknown' && changedPenaltyTotal > 0) {
        return 'changed_signal';
    }

    if (
        previousPlaceStatus &&
        previousPlaceStatus.status !== status
    ) {
        return 'evidence_shift';
    }

    if (hasConfirmation) {
        return 'confirmation';
    }

    return 'new_evidence';
}

function makeEvidenceRef(type, id, weight) {
    return {
        type,
        id,
        weight: roundWeight(weight)
    };
}

function getPlaceStatusSnapshot(placeStatus) {
    return {
        status: placeStatus.status,
        confidenceScore: placeStatus.confidenceScore,
        freshnessScore: placeStatus.freshnessScore,
        trend: placeStatus.trend,
        lastSignalAt: placeStatus.freshestEvidenceAt,
        freshestEvidenceAt: placeStatus.freshestEvidenceAt,
        calculatedAt: placeStatus.calculatedAt,
        placeStatusId: placeStatus._id
    };
}

async function loadRecentEvidence({placeId, since}) {
    return Promise.all([
        PlaceUpdate.find({
            place: placeId,
            observedAt: {$gte: since}
        }).lean(),
        QuickSignal.find({
            place: placeId,
            observedAt: {$gte: since}
        }).lean(),
        Confirmation.find({
            place: placeId,
            observedAt: {$gte: since}
        }).lean()
    ]);
}

async function buildPlaceStatusTargetMap(confirmations, placeId) {
    const placeStatusIds = confirmations
        .map((confirmation) => confirmation.placeStatus)
        .filter(Boolean);

    if (placeStatusIds.length === 0) {
        return new Map();
    }

    const placeStatuses = await PlaceStatus.find({
        _id: {$in: placeStatusIds},
        place: placeId
    }).select('_id status').lean();

    return new Map(
        placeStatuses.map((placeStatus) => [
            String(placeStatus._id),
            placeStatus.status
        ])
    );
}

function addStateEvidence({
    evidence,
    type,
    scores,
    evidenceRefs,
    evidenceDates,
    freshnessScores,
    now
}) {
    if (!STATUS_VALUES.includes(evidence.status)) {
        return {
            added: false,
            verified: false
        };
    }

    const freshness = getFreshnessScore(evidence.observedAt, now);

    if (freshness <= 0) {
        return {
            added: false,
            verified: false
        };
    }

    const trust = getEvidenceTrust(evidence, type);
    const weight = freshness * trust;

    scores[evidence.status] += weight;
    evidenceRefs.push(makeEvidenceRef(type, evidence._id, weight));
    evidenceDates.push(evidence.observedAt);
    freshnessScores.push(freshness);

    return {
        added: true,
        verified: Boolean(evidence.visitVerified)
    };
}

function getTargetStatus({
    confirmation,
    statusByPlaceUpdateId,
    statusByQuickSignalId,
    statusByPlaceStatusId
}) {
    if (confirmation.placeUpdate) {
        return statusByPlaceUpdateId.get(String(confirmation.placeUpdate));
    }

    if (confirmation.quickSignal) {
        return statusByQuickSignalId.get(String(confirmation.quickSignal));
    }

    if (confirmation.placeStatus) {
        return statusByPlaceStatusId.get(String(confirmation.placeStatus));
    }

    return null;
}

function applyConfirmation({
    confirmation,
    targetStatus,
    scores,
    evidenceRefs,
    evidenceDates,
    freshnessScores,
    now
}) {
    if (!STATUS_VALUES.includes(targetStatus)) {
        return {
            added: false,
            verified: false,
            penalty: 0
        };
    }

    const freshness = getFreshnessScore(confirmation.observedAt, now);

    if (freshness <= 0) {
        return {
            added: false,
            verified: false,
            penalty: 0
        };
    }

    const trust = getConfirmationTrust(confirmation);
    const weight = freshness * trust;

    evidenceDates.push(confirmation.observedAt);
    freshnessScores.push(freshness);

    if (confirmation.type === 'still_valid') {
        scores[targetStatus] += weight;
        evidenceRefs.push(makeEvidenceRef('Confirmation', confirmation._id, weight));

        return {
            added: true,
            verified: Boolean(confirmation.visitVerified),
            penalty: 0
        };
    }

    if (confirmation.type === 'changed') {
        const penalty = weight;

        scores[targetStatus] = Math.max(0, scores[targetStatus] - penalty);
        evidenceRefs.push(makeEvidenceRef('Confirmation', confirmation._id, -penalty));

        return {
            added: true,
            verified: Boolean(confirmation.visitVerified),
            penalty
        };
    }

    return {
        added: false,
        verified: false,
        penalty: 0
    };
}

async function calculatePlaceStatus(placeId, options = {}) {
    if (!mongoose.isValidObjectId(placeId)) {
        const err = new Error('올바르지 않은 장소 ID입니다.');
        err.status = 400;
        err.code = 'INVALID_PLACE_ID';
        throw err;
    }

    const now = options.now || new Date();
    const since = new Date(now.getTime() - EVIDENCE_WINDOW_MS);

    const place = await Place.findById(placeId).select('_id');

    if (!place) {
        const err = new Error('장소를 찾을 수 없습니다.');
        err.status = 404;
        err.code = 'PLACE_NOT_FOUND';
        throw err;
    }

    const previousPlaceStatus = await PlaceStatus.findOne({place: placeId})
        .sort({calculatedAt: -1, createdAt: -1})
        .lean();

    const [
        placeUpdates,
        quickSignals,
        confirmations
    ] = await loadRecentEvidence({
        placeId,
        since
    });

    const statusByPlaceUpdateId = new Map(
        placeUpdates.map((placeUpdate) => [
            String(placeUpdate._id),
            placeUpdate.status
        ])
    );

    const statusByQuickSignalId = new Map(
        quickSignals.map((quickSignal) => [
            String(quickSignal._id),
            quickSignal.status
        ])
    );

    const statusByPlaceStatusId = await buildPlaceStatusTargetMap(
        confirmations,
        placeId
    );

    const scores = createEmptyScores();
    const evidenceRefs = [];
    const evidenceDates = [];
    const freshnessScores = [];
    let evidenceCount = 0;
    let verifiedEvidenceCount = 0;
    let stateEvidenceCount = 0;
    let changedPenaltyTotal = 0;
    let hasConfirmation = false;

    for (const placeUpdate of placeUpdates) {
        const result = addStateEvidence({
            evidence: placeUpdate,
            type: 'PlaceUpdate',
            scores,
            evidenceRefs,
            evidenceDates,
            freshnessScores,
            now
        });

        if (result.added) {
            evidenceCount += 1;
            stateEvidenceCount += 1;
        }

        if (result.verified) {
            verifiedEvidenceCount += 1;
        }
    }

    for (const quickSignal of quickSignals) {
        const result = addStateEvidence({
            evidence: quickSignal,
            type: 'QuickSignal',
            scores,
            evidenceRefs,
            evidenceDates,
            freshnessScores,
            now
        });

        if (result.added) {
            evidenceCount += 1;
            stateEvidenceCount += 1;
        }

        if (result.verified) {
            verifiedEvidenceCount += 1;
        }
    }

    for (const confirmation of confirmations) {
        const targetStatus = getTargetStatus({
            confirmation,
            statusByPlaceUpdateId,
            statusByQuickSignalId,
            statusByPlaceStatusId
        });

        const result = applyConfirmation({
            confirmation,
            targetStatus,
            scores,
            evidenceRefs,
            evidenceDates,
            freshnessScores,
            now
        });

        if (result.added) {
            evidenceCount += 1;
            hasConfirmation = true;
            changedPenaltyTotal += result.penalty;
        }

        if (result.verified) {
            verifiedEvidenceCount += 1;
        }
    }

    const roundedScores = {
        quiet: roundWeight(scores.quiet),
        normal: roundWeight(scores.normal),
        busy: roundWeight(scores.busy)
    };

    const sortedScores = STATUS_VALUES
        .map((status) => ({
            status,
            score: roundedScores[status]
        }))
        .sort((a, b) => b.score - a.score);

    const best = sortedScores[0];
    const positiveScoreTotal = STATUS_VALUES.reduce((total, status) => {
        return total + roundedScores[status];
    }, 0);

    const candidateStatus =
        positiveScoreTotal > 0 ? best.status : 'unknown';

    const consensus =
        positiveScoreTotal > 0 ? best.score / positiveScoreTotal : 0;

    const evidenceStrength = Math.min(1, positiveScoreTotal / 1.8);
    const confidenceScore = roundScore(consensus * evidenceStrength);
    const freshnessScore = roundScore(Math.max(0, ...freshnessScores));
    const hasEnoughEvidence =
        stateEvidenceCount > 0 &&
        best.score >= MIN_SCORE_FOR_STATUS &&
        confidenceScore >= MIN_CONFIDENCE_FOR_STATUS &&
        freshnessScore >= MIN_FRESHNESS_FOR_STATUS;

    const status = hasEnoughEvidence ? candidateStatus : 'unknown';
    const freshestEvidenceAt = getFreshestDate(evidenceDates);
    const calculatedAt = now;
    const validUntil = freshestEvidenceAt
        ? new Date(freshestEvidenceAt.getTime() + EVIDENCE_WINDOW_MS)
        : null;
    const trend = getTrend(previousPlaceStatus?.status, status);
    const changeReason = getChangeReason({
        previousPlaceStatus,
        status,
        hasStateEvidence: stateEvidenceCount > 0,
        changedPenaltyTotal,
        hasConfirmation
    });

    const placeStatus = await PlaceStatus.create({
        place: placeId,
        status,
        candidateStatus,
        confidenceScore,
        freshnessScore,
        evidenceCount,
        verifiedEvidenceCount,
        signalScores: roundedScores,
        trend,
        freshestEvidenceAt,
        calculatedAt,
        validUntil,
        evidenceRefs,
        changeReason
    });

    await Place.updateOne(
        {_id: placeId},
        {
            $set: {
                currentStatus: getPlaceStatusSnapshot(placeStatus)
            }
        }
    );

    return placeStatus.toObject();
}

async function calculatePlaceStatusSafely(placeId) {
    try {
        return await calculatePlaceStatus(placeId);
    } catch (err) {
        console.error(
            '[place-status-engine]',
            err.code || err.name,
            err.message
        );

        return null;
    }
}

module.exports = {
    calculatePlaceStatus,
    calculatePlaceStatusSafely,
    EVIDENCE_WINDOW_MS
};
