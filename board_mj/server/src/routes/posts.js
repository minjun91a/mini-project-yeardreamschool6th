const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const auth = require('../middlewares/auth');
const Comment = require('../models/comment');

router.get('/', async (req, res) => {
    console.log('[DEBUG] query:', req.query);

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const items = await Post.find()
        .sort({createdAt: -1})
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-content')
        .lean();
    const total = await Post.countDocuments();

    console.log('[DEBUG] 조회 결과:', {count: items.length, total, page, limit});
    return res.json({
        success: true,
        data: {items, page, limit, total}
    });
});

router.get('/:id', async (req, res) => {
    console.log('[DEBUG] params:', req.params);

    const post = await Post.findById(req.params.id);

    if (!post) {
        console.log('[DEBUG] 404 분기 진입');
        return res.status(404).json({
            success: false,
            error: {code: 'NOT_FOUND', message: '없는 게시글입니다.'}});
    }
    console.log('[DEBUG] 정상 분기 진입');

    return res.json({
        success: true,
        data: {post}
    });
});

router.post('/', auth, async (req, res) => {
    console.log('[DEBUG] body:', req.body);
    const post = await Post.create({
        title: req.body.title,
        content: req.body.content,
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
        console.log('[DEBUG] 404 분기 진입');
        return res.status(404).json({
            success: false,
            error: {code: 'NOT_FOUND', message: '없는 게시글입니다.'}});
    }
    console.log('[DEBUG] 정상 분기 진입');

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
        console.log('[DEBUG] 404 분기 진입');
        return res.status(404).json({
            success: false,
            error: {code: 'NOT_FOUND', message: '없는 게시글입니다.'}});
    }
    console.log('[DEBUG] 정상 분기 진입');

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
    console.log('[DEBUG] query:', req.query);
    const post = await Post.findById(req.params.id);
    if (!post) {
        console.log('[DEBUG] 404 분기 진입');
        return res.status(404).json({
            success: false,
            error: {code: 'NOT_FOUND', message: '없는 게시글입니다.'}});
    }
    console.log('[DEBUG] 정상 분기 진입');

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const items = await Comment.find({post: req.params.id})
        .sort({createdAt: 1})
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    const total = await Comment.countDocuments({post: req.params.id});

    console.log('[DEBUG] 조회 결과:', {count: items.length, total, page, limit});

    return res.json({
        success: true,
        data: {items, page, limit, total}
    });
});

router.post('/:id/comments', auth, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        console.log('[DEBUG] 404 분기 진입');
        return res.status(404).json({
            success: false,
            error: {code: 'NOT_FOUND', message: '없는 게시글입니다.'}});
    }
    console.log('[DEBUG] 정상 분기 정상');

    const comment = await Comment.create({
        post: req.params.id,
        author: req.user.sub,
        content: req.body.content
    });

    const r = await Post.updateOne({_id: req.params.id}, {$inc: {commentCount: 1}});

    console.log('[DEBUG] commentCount 갱신:', r.matchedCount, r.modifiedCount);

    return res.status(201).json({
        success: true,
        data: {comment}
    });
});

module.exports = router;