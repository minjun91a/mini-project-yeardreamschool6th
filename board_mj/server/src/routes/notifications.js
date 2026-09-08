const express = require('express');
const router = express.Router();

const Notification = require('../models/notification');
const auth = require('../middlewares/auth');
const mongoose = require("mongoose");

router.get('/', auth, async (req, res) => {
    const items = await Notification.find({
        user: req.user.sub
    })
        .select('type place post placeStatus statusFrom statusTo message isRead createdAt')
        .sort({createdAt: -1})
        .populate('place', 'name category address currentStatus')
        .populate('post', 'content status imageUrl createdAt')
        .populate('placeStatus', 'status confidenceScore freshnessScore calculatedAt')
        .lean();

    return res.status(200).json({
        success: true,
        data: {
            items
        }
    });
});

router.get('/unread-count', auth, async (req, res) => {
    const count = await Notification.countDocuments({
        user: req.user.sub,
        isRead: false
    });

    return res.status(200).json({
        success: true,
        data: {
            count
        }
    });
});

router.patch('/:id/read', auth, async (req, res) => {
    const {id} = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_ID',
                message: '올바르지 않은 알림 ID입니다.'
            }
        });
    }

    const notification = await Notification.findOneAndUpdate(
        {
            _id: id,
            user: req.user.sub
        },
        {
            $set: {
                isRead: true
            }
        },
        {
            new: true
        }
    );

    if (!notification) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'NOTIFICATION_NOT_FOUND',
                message: '알림을 찾을 수 없습니다.'
            }
        });
    }

    return res.status(200).json({
        success: true,
        data: {
            notification
        }
    });
});

module.exports = router;
