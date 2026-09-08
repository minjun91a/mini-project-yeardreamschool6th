const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const auth = require('../middlewares/auth');
const Comment = require('../models/comment');
const mongoose = require('mongoose');
const Place = require('../models/place');
const upload = require('../middlewares/upload');
const User = require('../models/user');
const Notification = require('../models/notification');
const PlaceUpdate = require('../models/placeUpdate');
const {getDistanceMeters} = require('../services/geo');

function uploadSingleImage(req, res, next) {
    upload.single('image')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'IMAGE_TOO_LARGE',
                        message: '이미지는 5MB 이하만 업로드할 수 있습니다.'
                    }
                });
            }

            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_IMAGE',
                    message: err.message || '이미지 업로드에 실패했습니다.'
                }
            });
        }

        return next();
    });
}

router.get('/', async (req, res) => {

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const kind = req.query.kind;
    const author = req.query.author;

    const filter = {};

    if (kind) {
        filter.kind = kind;
    }

    if (author) {
        if (!mongoose.isValidObjectId(author)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_AUTHOR_ID',
                    message: '올바르지 않은 사용자 ID입니다.'
                }
            });
        }

        filter.author = author;
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
    await post.populate([
        {
            path: 'author',
            select: 'id name'
        },
        {
            path: 'place',
            select: 'name category address'
        }
    ]);

    return res.json({
        success: true,
        data: {post}
    });
});

router.post(
    '/',
    auth,
    uploadSingleImage,
    async (req, res) => {
        const kind = req.body.kind || 'board';

        const {
            title,
            content,
            placeId,
            status,
            longitude,
            latitude
        } = req.body;

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

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
            let distanceFromPlace = null;

            const longitudeNumber = Number(longitude);
            const latitudeNumber = Number(latitude);

            if (
                Number.isFinite(longitudeNumber) &&
                Number.isFinite(latitudeNumber) &&
                place?.location?.coordinates?.length === 2
            ) {
                const [placeLongitude, placeLatitude] =
                    place.location.coordinates;

                distanceFromPlace = getDistanceMeters(
                    latitudeNumber,
                    longitudeNumber,
                    placeLatitude,
                    placeLongitude
                );

                visitVerified = distanceFromPlace <= 300;
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
                visitVerified,
                imageUrl
            });

            await PlaceUpdate.create({
                place: placeId,
                author: req.user.sub,
                status,
                originalText: content,
                content,
                images: imageUrl ? [{url: imageUrl}] : [],
                signals: [],
                visitVerified,
                distanceFromPlace,
                source: 'community',
                legacyPost: post._id,
                observedAt: post.createdAt
            });

            await Place.updateOne(
                {_id: placeId},
                {
                    $inc: {
                        'stats.updateCount': 1
                    },
                    $set: {
                        'stats.lastSignalAt': post.createdAt
                    }
                }
            );

            const followers = await User.find({
                followedPlaces: placeId,
                _id: {$ne: req.user.sub}
            }).select('_id');

            if (followers.length > 0) {
                const notifications = followers.map((user) => ({
                    user: user._id,
                    type: 'place_now',
                    place: placeId,
                    post: post._id
                }));

                await Notification.insertMany(notifications);
            }

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
