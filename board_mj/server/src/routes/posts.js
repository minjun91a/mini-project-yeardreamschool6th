const express = require('express');
const router = express.Router();
const Post = require('../models/post');

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
        return res.status(404).json({success: false, error: {code: 'NOT_FOUND', message: '없는 게시글입니다.'}});
    }
    console.log('[DEBUG] 정상 분기 진입');

    return res.json({
        success: true,
        data: {post}
    });
});

router.post('/', async (req, res) => {
    console.log('[DEBUG] body:', req.body);
    const post = await Post.create({
        title: req.body.title,
        content: req.body.content,
        author: '6a94f37218c185cb9cff06b3'
    });

    return res.status(201).json({
        success: true,
        data: {post}
    });
});

module.exports = router;