const express = require('express');
const mongoose = require('mongoose');

const User = require('../models/user');
const auth = require('../middlewares/auth');

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
        .select('_id id name followers following followedPlaces')
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

    return res.status(200).json({
        success: true,
        data: {
            user: {
                ...user,
                followerCount: user.followers?.length || 0,
                followingCount: user.following?.length || 0,
                followedPlaceCount: user.followedPlaces?.length || 0
            }
        }
    });
});


/* =========================================================
   POST /api/users/:id/follow
   사용자 팔로우
========================================================= */

router.post('/:id/follow', auth, async (req, res) => {
    const targetUserId = req.params.id;
    const currentUserId = req.user.sub;

    if (!mongoose.isValidObjectId(targetUserId)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_USER_ID',
                message: '올바르지 않은 사용자 ID입니다.'
            }
        });
    }

    if (String(targetUserId) === String(currentUserId)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'CANNOT_FOLLOW_SELF',
                message: '자기 자신은 팔로우할 수 없습니다.'
            }
        });
    }

    const [currentUser, targetUser] = await Promise.all([
        User.findById(currentUserId),
        User.findById(targetUserId)
    ]);

    if (!currentUser || !targetUser) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'USER_NOT_FOUND',
                message: '사용자를 찾을 수 없습니다.'
            }
        });
    }

    const alreadyFollowing = currentUser.following.some(
        (userId) => String(userId) === String(targetUserId)
    );

    if (alreadyFollowing) {
        return res.status(409).json({
            success: false,
            error: {
                code: 'ALREADY_FOLLOWING',
                message: '이미 팔로우 중인 사용자입니다.'
            }
        });
    }

    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);

    await Promise.all([
        currentUser.save(),
        targetUser.save()
    ]);

    return res.status(200).json({
        success: true,
        data: {
            isFollowing: true,
            followerCount: targetUser.followers.length,
            followingCount: currentUser.following.length
        }
    });
});


/* =========================================================
   DELETE /api/users/:id/follow
   사용자 언팔로우
========================================================= */

router.delete('/:id/follow', auth, async (req, res) => {
    const targetUserId = req.params.id;
    const currentUserId = req.user.sub;

    if (!mongoose.isValidObjectId(targetUserId)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_USER_ID',
                message: '올바르지 않은 사용자 ID입니다.'
            }
        });
    }

    if (String(targetUserId) === String(currentUserId)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'CANNOT_UNFOLLOW_SELF',
                message: '자기 자신은 언팔로우할 수 없습니다.'
            }
        });
    }

    const [currentUser, targetUser] = await Promise.all([
        User.findById(currentUserId),
        User.findById(targetUserId)
    ]);

    if (!currentUser || !targetUser) {
        return res.status(404).json({
            success: false,
            error: {
                code: 'USER_NOT_FOUND',
                message: '사용자를 찾을 수 없습니다.'
            }
        });
    }

    const isFollowing = currentUser.following.some(
        (userId) => String(userId) === String(targetUserId)
    );

    if (!isFollowing) {
        return res.status(409).json({
            success: false,
            error: {
                code: 'NOT_FOLLOWING',
                message: '팔로우 중인 사용자가 아닙니다.'
            }
        });
    }

    currentUser.following.pull(targetUserId);
    targetUser.followers.pull(currentUserId);

    await Promise.all([
        currentUser.save(),
        targetUser.save()
    ]);

    return res.status(200).json({
        success: true,
        data: {
            isFollowing: false,
            followerCount: targetUser.followers.length,
            followingCount: currentUser.following.length
        }
    });
});


module.exports = router;