const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const auth = require('../middlewares/auth');
const Comment = require('../models/comment');
const mongoose = require('mongoose');
const Place = require('../models/place');

function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;

    const toRad = (value) => value * Math.PI / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
    );

    return R * c;
}

router.get('/', async (req, res) => {

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const kind = req.query.kind;
    const filter = {};

    if (kind) {
        filter.kind = kind;
    }

    const items = await Post.find(filter)
        .sort({createdAt: -1})
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'id name')
        .populate('place', 'name category address')
        .lean();

    const total = await Post.countDocuments(filter);

    return res.json({
        success: true,
        data: {items, page, limit, total}
    });
});

router.get('/:id', async (req, res) => {

    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({
            success: false,
            error: {code: 'NOT_FOUND', message: '없는 게시글입니다.'}
        });
    }

    post.viewCount += 1;
    await post.save();
    await post.populate('author', 'id name');

    return res.json({
        success: true,
        data: {post}
    });
});

router.post('/', auth, async (req, res) => {
    const kind = req.body.kind || 'board';

    const {
        title,
        content,
        placeId,
        status,
        longitude,
        latitude
    } = req.body;

    const allowedKinds = ['board', 'now'];

    if (!allowedKinds.includes(kind)) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_KIND',
                message: '게시글 종류가 올바르지 않습니다.'
            }
        });
    }

    if (kind === 'now') {
        if (!placeId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'PLACE_ID_REQUIRED',
                    message: '장소를 선택해주세요.'
                }
            });
        }

        if (!mongoose.isValidObjectId(placeId)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PLACE_ID',
                    message: '올바르지 않은 장소 ID입니다.'
                }
            });
        }

        const place = await Place.findById(placeId);

        if (!place) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'PLACE_NOT_FOUND',
                    message: '장소를 찾을 수 없습니다.'
                }
            });
        }

        let visitVerified = false;

        if (
            Number.isFinite(longitude) &&
            Number.isFinite(latitude) &&
            place?.location?.coordinates?.length === 2
        ) {
            const [placeLongitude, placeLatitude] =
                place.location.coordinates;

            const distance = getDistanceMeters(
                latitude,
                longitude,
                placeLatitude,
                placeLongitude
            );

            visitVerified = distance <= 300;
        }

        const allowedStatuses = ['quiet', 'normal', 'busy'];

        if (!status) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'STATUS_REQUIRED',
                    message: '현재 상태를 선택해주세요.'
                }
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS',
                    message: '현재 상태 값이 올바르지 않습니다.'
                }
            });
        }

        if (typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'CONTENT_REQUIRED',
                    message: '내용을 입력해주세요.'
                }
            });
        }

        const post = await Post.create({
            kind: 'now',
            content,
            author: req.user.sub,
            place: placeId,
            status,
            visitVerified
        });

        return res.status(201).json({
            success: true,
            data: {post}
        });
    }

    if (typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'TITLE_REQUIRED',
                message: '제목을 입력해주세요.'
            }
        });
    }

    if (typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({
            success: false,
            error: {
                code: 'CONTENT_REQUIRED',
                message: '내용을 입력해주세요.'
            }
        });
    }

    const post = await Post.create({
        kind: 'board',
        title,
        content,
        author: req.user.sub
    });

    return res.status(201).json({
        success: true,
        data: {post}
    });
});

router.patch('/:id', auth, async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({
            success: false,
            error: {code: 'NOT_FOUND', message: '없는 게시글입니다.'}
        });
    }

    if (String(post.author) !== req.user.sub && req.user.grade !== 'admin') {
        return res.status(403).json({
            success: false,
            error: {code: 'FORBIDDEN', message: '권한이 없습니다.'}
        });
    }

    if (req.body.title !== undefined) post.title = req.body.title;
    if (req.body.content !== undefined) post.content = req.body.content;

    await post.save();

    return res.json({
        success: true,
        data: {post}
    });
});

router.delete('/:id', auth, async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({
            success: false,
            error: {code: 'NOT_FOUND', message: '없는 게시글입니다.'}
        });
    }

    if (String(post.author) !== req.user.sub && req.user.grade !== 'admin') {
        return res.status(403).json({
            success: false,
            error: {code: 'FORBIDDEN', message: '권한이 없습니다.'}
        })
    }

    await post.deleteOne();

    return res.json({
        success: true,
        data: {deletedId: post._id}
    });
});

router.get('/:id/comments', async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        return res.status(404).json({
            success: false,
            error: {code: 'NOT_FOUND', message: '없는 게시글입니다.'}
        });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const items = await Comment.find({post: req.params.id})
        .sort({createdAt: 1})
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'id name')
        .lean();
    const total = await Comment.countDocuments({post: req.params.id});

    return res.json({
        success: true,
        data: {items, page, limit, total}
    });
});

router.post('/:id/comments', auth, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        return res.status(404).json({
            success: false,
            error: {code: 'NOT_FOUND', message: '없는 게시글입니다.'}
        });
    }

    const comment = await Comment.create({
        post: req.params.id,
        author: req.user.sub,
        content: req.body.content
    });

    const r = await Post.updateOne({_id: req.params.id}, {$inc: {commentCount: 1}});

    return res.status(201).json({
        success: true,
        data: {comment}
    });
});

module.exports = router;