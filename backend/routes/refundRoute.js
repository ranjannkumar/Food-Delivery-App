import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
    requestRefund,
    approveRefund,
    rejectRefund,
    getPendingRefunds,
    stripeWebhook, 
} from "../controllers/refundController.js";

const refundRouter = express.Router();

refundRouter.post("/orders/:orderId/request",authMiddleware, requestRefund);

refundRouter.post("/admin/approve/:orderId", approveRefund);
refundRouter.post("/admin/reject/:orderId", rejectRefund);
refundRouter.get("/admin/pending", getPendingRefunds);

refundRouter.post("/webhooks/stripe", express.raw({ type: 'application/json' }), stripeWebhook);

export default refundRouter;
