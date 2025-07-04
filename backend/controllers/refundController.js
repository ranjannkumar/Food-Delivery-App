import orderModel from "../models/orderModel.js"; 
import refundRequestModel from "../models/refundRequestModel.js"; 
import stripe from '../config/stripe.js'; 

const isOrderEligibleForRefundRequest = (order) => {
    const orderStatusLower = order.status ? order.status.toLowerCase() : '';
    const refundStatusLower = order.refundStatus ? order.refundStatus.toLowerCase() : '';

    if (order.payment && (orderStatusLower === 'delivered' || orderStatusLower === 'cancelled') &&
        (refundStatusLower === 'none' || refundStatusLower === 'rejected' || refundStatusLower === 'failed')) {
        console.log("  Order IS eligible for refund request.");
        return true;
    }
    console.log("  Order IS NOT eligible for refund request.");
    return false;
};

//user
export const requestRefund = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const userId = req.user.id; 

        const order = await orderModel.findOne({ _id: orderId, userId: userId });

        if (!order) {
            return res.json({ success: false, message: 'Order not found or unauthorized.' });
        }

        if (!isOrderEligibleForRefundRequest(order)) {
            return res.json({ success: false, message: 'Order is not eligible for a refund request at this time.' });
        }

        // Update Order model
        order.refundStatus = 'REQUESTED';
        order.refundReason = reason;
        order.refundRequestedAt = new Date();
        await order.save();

        const newRefundRequest = new refundRequestModel({
            orderId: order._id,
            userId: userId,
            requestedAmount: order.amount, 
            reason: reason,
            status: 'REQUESTED'
        });
        await newRefundRequest.save();

        res.json({ success: true, message: 'Refund request submitted successfully.', order });

    } catch (error) {
        console.error('Error in requestRefund:', error);
        res.json({ success: false, message: 'Server error during refund request.' });
    }
};
//admin
export const approveRefund = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { refundAmount, notes } = req.body;

        console.log("approveRefund Debug: Received refundAmount:", refundAmount, "notes:", notes);

        const order = await orderModel.findById(orderId);

        if (!order) {
            console.error("approveRefund Error: Order not found for ID:", orderId);
            return res.json({ success: false, message: 'Order not found.' });
        }


        if (order.refundStatus !== 'REQUESTED' && order.refundStatus !== 'PENDING_APPROVAL') {
            console.error("approveRefund Error: Refund not in eligible state. Current status:", order.refundStatus);
            return res.json({ success: false, message: 'Refund is not in a state to be approved.' });
        }

        const actualRefundAmount = refundAmount ? parseFloat(refundAmount) : order.amount;
        if (isNaN(actualRefundAmount) || actualRefundAmount <= 0 || parseFloat(refundAmount) > order.amount) { 
            console.error("approveRefund Error: Invalid refund amount. Provided:", refundAmount, "Order amount:", order.amount);
            return res.json({ success: false, message: 'Invalid refund amount provided.' });
        }

        order.refundStatus = 'PROCESSING';
        order.refundNotes = notes;
        order.refundAmount = actualRefundAmount;
        await order.save();

        await refundRequestModel.findOneAndUpdate(
            { orderId: order._id, status: 'REQUESTED' },
            { status: 'PROCESSING', actualRefundAmount: actualRefundAmount, notes: notes }, 
            { new: true }
        );

        // --- CRITICAL FIX: Retrieve Payment Intent to get the Charge ID ---
        let chargeIdToRefund = order.transactionId; 

        try {
            console.log("approveRefund Debug: Retrieving Payment Intent:", order.transactionId);
            const paymentIntent = await stripe.paymentIntents.retrieve(order.transactionId, {
                expand: ['latest_charge'], 
            });

            if (paymentIntent && paymentIntent.latest_charge) {
                chargeIdToRefund = paymentIntent.latest_charge.id;
                console.log("approveRefund Debug: Found associated Charge ID:", chargeIdToRefund);
            } else {
                console.warn("approveRefund Warning: No latest_charge found for Payment Intent. Proceeding with Payment Intent ID for refund.");
            }
        } catch (piError) {
            console.error("approveRefund Error: Failed to retrieve Payment Intent or its charge:", piError.message);
            console.warn("approveRefund Warning: Falling back to original transactionId for refund due to Payment Intent retrieval error.");
        }

        // Initiate Stripe Refund
        const stripeRefund = await stripe.refunds.create({
            charge: chargeIdToRefund, // Use the retrieved charge ID or original transactionId
            amount: Math.round(actualRefundAmount * 100),
            reason: 'requested_by_customer',
            metadata: { order_id: order._id.toString(), refund_request_id: order._id.toString() }
        });
        console.log("approveRefund Debug: Stripe refund initiated successfully. Stripe Refund ID:", stripeRefund.id);

        res.json({ success: true, message: 'Refund initiated successfully. Final status will be updated via webhook.', refund: stripeRefund });

    } catch (error) {
        console.error('Error in approveRefund (Stripe API call failed):', error);
        if (error.type && error.raw && error.raw.message) {
            console.error("Stripe Error Details:", error.raw.message);
        }
        await orderModel.findByIdAndUpdate(req.params.orderId, {
            refundStatus: 'REQUESTED',
            refundNotes: null,
            refundAmount: 0
        });
        await refundRequestModel.findOneAndUpdate(
            { orderId: req.params.orderId, status: 'PROCESSING' },
            { status: 'FAILED', notes: `Stripe initiation failed: ${error.message}` },
            { new: true }
        );
        res.json({ success: false, message: 'Failed to initiate refund with payment gateway.' });
    }
};

export const rejectRefund = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { notes } = req.body;

        const order = await orderModel.findById(orderId);

        if (!order) {
            return res.json({ success: false, message: 'Order not found.' });
        }

        if (order.refundStatus !== 'REQUESTED' && order.refundStatus !== 'PENDING_APPROVAL') {
            return res.json({ success: false, message: 'Refund is not in a state to be rejected.' });
        }

        order.refundStatus = 'REJECTED';
        order.refundNotes = notes;
        order.refundProcessedAt = new Date();
        await order.save();

        await refundRequestModel.findOneAndUpdate(
            { orderId: order._id, status: 'REQUESTED' },
            { status: 'REJECTED', notes: notes, processedAt: new Date() }, 
            { new: true }
        );

        res.json({ success: true, message: 'Refund request rejected successfully.', order });

    } catch (error) {
        console.error('Error in rejectRefund:', error);
        res.json({ success: false, message: 'Server error during refund rejection.' });
    }
};

export const getPendingRefunds = async (req, res) => {
    try {
        const pendingOrders = await orderModel.find({
            refundStatus: { $in: ['REQUESTED', 'PENDING_APPROVAL', 'PROCESSING'] }
        }).sort({ refundRequestedAt: -1 });

        res.json({ success: true, orders: pendingOrders });
    } catch (error) {
        console.error('Error in getPendingRefunds:', error);
        res.json({ success: false, message: 'Server error fetching pending refunds.' });
    }
};

export const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error(`Stripe Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'charge.refunded':
            const refund = event.data.object;
            console.log(`Stripe Webhook: Charge ${refund.charge} refunded. Refund ID: ${refund.id}. Status: ${refund.status}`);

            const order = await orderModel.findOne({ transactionId: refund.charge });

            if (order) {
                order.refundStatus = 'COMPLETED';
                order.payment = false;
                order.refundProcessedAt = new Date();
                order.refundTransactionId = refund.id;
                order.refundAmount = refund.amount / 100;
                await order.save();

                await refundRequestModel.findOneAndUpdate(
                    { orderId: order._id, paymentGatewayRefundId: { $ne: null } },
                    { status: 'COMPLETED', actualRefundAmount: refund.amount / 100, paymentGatewayRefundId: refund.id, processedAt: new Date() },
                    { new: true, upsert: true }
                );
            } else {
                console.warn(`Stripe Webhook: Order not found for charge ID ${refund.charge}.`);
            }
            break;
        case 'charge.refund.updated':
            const updatedRefund = event.data.object;
            console.log(`Stripe Webhook: Refund ID ${updatedRefund.id} updated. New status: ${updatedRefund.status}`);

            if (updatedRefund.status === 'failed') {
                const orderToUpdate = await orderModel.findOne({ transactionId: updatedRefund.charge });
                if (orderToUpdate) {
                    orderToUpdate.refundStatus = 'FAILED';
                    orderToUpdate.refundNotes = `Refund failed by payment gateway: ${updatedRefund.failure_reason || 'Unknown reason'}`;
                    await orderToUpdate.save();

                    await refundRequestModel.findOneAndUpdate(
                        { orderId: orderToUpdate._id, paymentGatewayRefundId: updatedRefund.id },
                        { status: 'FAILED', notes: orderToUpdate.refundNotes, processedAt: new Date() },
                        { new: true }
                    );
                }
            }
            break;
        default:
            console.log(`Stripe Webhook: Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};


