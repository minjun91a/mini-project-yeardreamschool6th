const Notification = require('../models/notification');
const PlaceFollow = require('../models/placeFollow');

const NOTIFICATION_CONFIDENCE_THRESHOLD = 0.55;

function shouldNotifyStatusChange({previousPlaceStatus, placeStatus}) {
    if (!previousPlaceStatus) {
        return false;
    }

    if (previousPlaceStatus.status === placeStatus.status) {
        return false;
    }

    if (placeStatus.status === 'unknown') {
        return false;
    }

    return placeStatus.confidenceScore >= NOTIFICATION_CONFIDENCE_THRESHOLD;
}

async function createPlaceStatusChangeNotifications({
    previousPlaceStatus,
    placeStatus,
    actorId
}) {
    if (!shouldNotifyStatusChange({previousPlaceStatus, placeStatus})) {
        return {
            createdCount: 0
        };
    }

    const filter = {
        place: placeStatus.place,
        'notificationPreferences.statusChanges': {$ne: false}
    };

    if (actorId) {
        filter.user = {$ne: actorId};
    }

    const placeFollows = await PlaceFollow.find(filter)
        .select('user')
        .lean();

    if (placeFollows.length === 0) {
        return {
            createdCount: 0
        };
    }

    const notifications = placeFollows.map((follow) => ({
        user: follow.user,
        type: 'place_status_changed',
        place: placeStatus.place,
        placeStatus: placeStatus._id,
        statusFrom: previousPlaceStatus.status,
        statusTo: placeStatus.status,
        message: '관심 장소의 현재 상태가 바뀌었습니다.'
    }));

    await Notification.insertMany(notifications, {
        ordered: false
    });

    return {
        createdCount: notifications.length
    };
}

module.exports = {
    createPlaceStatusChangeNotifications,
    shouldNotifyStatusChange
};
