const express = require('express');
const router = express.Router();
var table = require('../lib/table');

// 테이블 목록
router.get('/', (req, res) => { table.list(req, res); });

// 특정 테이블 데이터 조회
router.get('/view/:tableName', (req, res) => { table.view(req, res); });

// 특정 테이블 데이터 생성 화면
router.get('/create/:tableName', (req, res) => { table.create(req, res); });

// 특정 테이블 데이터 생성 처리
router.post('/create_process/:tableName', (req, res) => { table.create_process(req, res); });

// 특정 테이블 데이터 수정 화면
router.get('/update/:tableName/:pkValue', (req, res) => { table.update(req, res); });

// 특정 테이블 데이터 수정 처리
router.post('/update_process/:tableName', (req, res) => { table.update_process(req, res); });

// 특정 테이블 데이터 삭제
router.get('/delete/:tableName/:pkValue', (req, res) => { table.delete_process(req, res); });

module.exports = router;
