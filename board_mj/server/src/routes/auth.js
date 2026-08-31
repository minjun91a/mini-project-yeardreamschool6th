const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const auth = require('../middlewares/auth');

router.post('/signup', async function (req, res) {
    const {id, pw, name} = req.body;

    const result = await User.create({id, pw, name});
    const user = result.toObject();
    delete user.pw;

    return res.status(201).json({
        success: true,
        data: {user}
    });
});

router.post('/login', async function (req, res) {
    const {id, pw} = req.body;

    const user = await User.findOne({id}).select('+pw');

    if (!user) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_LOGIN',
                message: '아이디 또는 비밀번호가 올바르지 않습니다.'
            }
        });
    }

    const ok = await user.checkPw(pw);

    if (!ok) {
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_LOGIN',
                message: '아이디 또는 비밀번호가 올바르지 않습니다.'
            }
        });
    }

    const token = jwt.sign(
        {sub: user._id, id: user.id, grade: user.grade},
        process.env.JWT_SECRET,
        {expiresIn: '1h'}
    );

    const safeUser = user.toObject();
    delete safeUser.pw;

    return res.json({
        success: true,
        data: {token, user: safeUser}
    });
});

router.get('/me', auth, async function (req, res) {
    const user = await User.findById(req.user.sub);

    if (!user) {
        return res.status(404).json({
            success: false,
            error: {code: 'NOT_FOUND', message: '없는 사용자입니다.'}
        });
    }

    return res.json({
        success: true,
        data: {user}
    });
});

module.exports = router;