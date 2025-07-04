import mongoose from 'mongoose';

const refundRequestSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'order', 
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user', 
        required: true
    },
    requestedAmount: { 
        type: Number,
        required: true
    },
    actualRefundAmount: { 
        type: Number,
        default: 0
    },
    reason: { 
        type: String,
        required: true
    },
    notes: { 
        type: String
    },
    status: {
        type: String,
        enum: ['REQUESTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED'],
        default: 'REQUESTED'
    },
    paymentGatewayRefundId: { 
        type: String,
        unique: true,
        sparse: true
    },
    requestedAt: {
        type: Date,
        default: Date.now
    },
    processedAt: {
        type: Date
    },
    processedBy: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }

});

const refundRequestModel = mongoose.models.refundRequest || mongoose.model('refundRequest', refundRequestSchema);
export default refundRequestModel;
