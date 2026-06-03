const express = require('express');
const router = express.Router();
var board = require('../lib/board');

// 게시판 글 목록 (numPerPage, type_id 포함)
router.get('/view/:numPerPage/:typeId', (req, res) => { board.view(req, res); });

// 글쓰기 화면
router.get('/create/:typeId', (req, res) => { board.create(req, res); });

// 글쓰기 처리
router.post('/create_process', (req, res) => { board.create_process(req, res); });

// 글 상세보기 (re_YN 포함)
router.get('/detail/:boardId/:typeId/:re_YN', (req, res) => { board.detail(req, res); });

// 글 수정 화면
router.get('/update/:boardId/:typeId', (req, res) => { board.update(req, res); });

// 글 수정 처리
router.post('/update_process', (req, res) => { board.update_process(req, res); });

// 글 삭제
router.get('/delete/:boardId/:typeId', (req, res) => { board.delete_process(req, res); });

// 답글 작성 화면 (관리자만)
router.get('/answer/:boardId/:typeId', (req, res) => { board.answer(req, res); });

// 답글 작성 처리
router.post('/answer_process', (req, res) => { board.answer_process(req, res); });

module.exports = router;
