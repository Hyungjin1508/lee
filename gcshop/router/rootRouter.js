const express = require('express');
const router = express.Router();
var root = require('../lib/root');

// 메인 페이지 (상품 목록)
router.get('/', (req, res) => { root.home(req, res); });

// 상품 상세보기 (이미지 클릭 시)
router.get('/detail/:prodId', (req, res) => { root.detail(req, res); });

// 검색
router.get('/search', (req, res) => { root.search(req, res); });

// 카테고리별 조회
router.get('/category/:mainId/:subId', (req, res) => { root.category(req, res); });

module.exports = router;