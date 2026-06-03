const express = require('express');
const router = express.Router();
var purchase = require('../lib/purchase');

// === 고객용 기능 ===

// 구매 목록 (Purchase List)
router.get('/', (req, res) => { purchase.purchase(req, res); });

// 구매 상세 (구매 버튼 클릭 시 수량 입력 화면)
router.get('/detail/:prodId', (req, res) => { purchase.purchasedetail(req, res); });

// 결재 처리 (purchaseDetail에서 결재 클릭)
router.post('/purchase_process', (req, res) => { purchase.purchase_process(req, res); });

// 구매 취소
router.get('/cancel/:purchaseId', (req, res) => { purchase.cancel(req, res); });

// 장바구니 보기
router.get('/cart', (req, res) => { purchase.cart(req, res); });

// 장바구니에 담기
router.post('/addcart', (req, res) => { purchase.addcart(req, res); });

// 장바구니에서 결재 (체크박스 선택된 것)
router.post('/cartpurchase_process', (req, res) => { purchase.cartpurchase_process(req, res); });

// 장바구니에서 삭제 (체크박스 선택된 것)
router.post('/cartdelete_process', (req, res) => { purchase.cartdelete_process(req, res); });

// === 관리자용 기능 (RUD) ===

// purchase 테이블 관리자 조회
router.get('/purchaseview', (req, res) => { purchase.purchaseview(req, res); });

// purchase 수정 화면
router.get('/purchaseupdate/:purchaseId', (req, res) => { purchase.purchaseupdate(req, res); });

// purchase 수정 처리
router.post('/purchaseupdate_process', (req, res) => { purchase.purchaseupdate_process(req, res); });

// purchase 삭제
router.get('/purchasedelete/:purchaseId', (req, res) => { purchase.purchasedelete(req, res); });

// cart 테이블 관리자 조회
router.get('/cartview', (req, res) => { purchase.cartview(req, res); });

// cart 수정 화면
router.get('/cartupdate/:cartId', (req, res) => { purchase.cartupdate(req, res); });

// cart 수정 처리
router.post('/cartupdate_process', (req, res) => { purchase.cartupdate_process(req, res); });

// cart 삭제
router.get('/cartdelete/:cartId', (req, res) => { purchase.cartdelete(req, res); });

module.exports = router;
