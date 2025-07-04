import mongoose from "mongoose"

const orderSchema = new mongoose.Schema({
  userId:{
    type:String,
    required:true
  },
  items:{
    type:Array,
    required:true
  },
  amount:{
    type:Number,
    required:true
  },
  address:{
    type:Object,
    required:true
  },
  status:{
    type:String,
    default: "Food Processing"
  },
  date:{
    type:Date,
    default:Date.now()
  },
  payment:{
    type:Boolean,
    default:false
  },
  transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    //  FIELDS (Remain on Order Model)
    refundStatus: {
        type: String,
        enum: ['NONE', 'REQUESTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED'],
        default: 'NONE'
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    refundReason: {
        type: String
    },
    refundNotes: {
        type: String
    },
    refundRequestedAt: {
        type: Date
    },
    refundProcessedAt: {
        type: Date
    },
    refundTransactionId: {
        type: String,
        unique: true,
        sparse: true
    }
})

const orderModel = mongoose.models.order || mongoose.model("order",orderSchema)
export default orderModel;