const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/user');
const auth = require('../middlewares/auth');
const PlaceFollow = require('../models/placeFollow');
const PlaceUpdate = require('../models/placeUpdate');
const QuickSignal = require('../models/quickSignal');
const Confirmation = require('../models/confirmation');

const router = express.Router();


/* =========================================================
   GET /api/users/:id
   사용자 프로필 조회
========================================================= */

router.get('/:id', async (req, res) => {
    const {id} = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_USER_ID',
                message: '올바르지 않은 사용자 ID입니다.'
            }
        });
    }

    const user = await User.findById(id)
        .select('_id id name createdAt')
        .lean();

    if (!user) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'USER_NOT_FOUND',
                message: '사용자를 찾을 수 없습니다.'
            }
        });
    }

    const [
        followedPlaceCount,
        placeUpdateCount,
        quickSignalCount,
        confirmationCount
    ] = await Promise.all([
        PlaceFollow.countDocuments({user: id}),
        PlaceUpdate.countDocuments({author: id}),
        QuickSignal.countDocuments({author: id}),
        Confirmation.countDocuments({author: id})
    ]);

    return res.status(200).json({
        success: true,
        data: {
            user: {
                ...user,
                followedPlaceCount,
                contributionCount:
                    placeUpdateCount +
                    quickSignalCount +
                    confirmationCount,
                contributionBreakdown: {
                    placeUpdates: placeUpdateCount,
                    quickSignals: quickSignalCount,
                    confirmations: confirmationCount
                }
            }
        }
    });
});


/* =========================================================
   POST /api/users/:id/follow
   사용자 팔로우
========================================================= */

router.post('/:id/follow', auth, async (req, res) => {
    return res.status(410).json({
        success: false,
        error: {
            code: 'USER_FOLLOW_REMOVED',
            message: '사람 팔로우는 제공하지 않습니다. 관심 장소를 팔로우해주세요.'
        }
    });
});


/* =========================================================
   DELETE /api/users/:id/follow
   사용자 언팔로우
========================================================= */

router.delete('/:id/follow', auth, async (req, res) => {
    return res.status(410).json({
        success: false,
        error: {
            code: 'USER_FOLLOW_REMOVED',
            message: '사람 팔로우는 제공하지 않습니다. 관심 장소를 팔로우해주세요.'
        }
    });
});


module.exports = router;
