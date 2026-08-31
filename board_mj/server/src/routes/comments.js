const express = require('express');
const router = express.Router();
const Comment = require('../models/comment');
const Post = require('../models/post');
const auth = require('../middlewares/auth');

router.patch('/:id', auth, async (req, res) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        return res.status(404).json({
            success: false,
            error: {code: 'NOT_FOUND', message: '없는 댓글입니다.'}});
    }

    if (String(comment.author) !== req.user.sub && req.user.grade !== 'admin') {
        return res.status(403).json({
            success: false,
            error: {code: 'FORBIDDEN', message: '권한이 없습니다.'}
        });
    }

    if (req.body.content !== undefined) comment.content = req.body.content;

    await comment.save();

    return res.json({
        success: true,
        data: {comment}
    });
});

router.delete('/:id', auth, async (req, res) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        return res.status(404).json({
            success: false,
            error: {code: 'NOT_FOUND', message: '없는 댓글입니다.'}});
    }

    if (String(comment.author) !== req.user.sub && req.user.grade !== 'admin') {
        return res.status(403).json({
            success: false,
            error: {code: 'FORBIDDEN', message: '권한이 없습니다.'}
        })
    }

    await comment.deleteOne();
    await Post.updateOne({_id: comment.post}, {$inc: {commentCount: -1}});

    return res.json({
        success: true,
        data: {deletedId: comment._id}
    });
});

module.exports = router;