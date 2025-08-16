import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import stripe from '../config/stripe.js'; 

export const placeOrder = async(req,res) =>{

    const frontend_url = process.env.CLIENT_URL ;

    try {
        if (!req.user || !req.user.id) {
            console.log("placeOrder Error: User ID not available from authMiddleware.");
            return res.json({ success: false, message: "Authentication required for placing order." });
        }

        const newOrder = new orderModel({
            userId: req.user.id, 
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address
        })
        await newOrder.save();

        await userModel.findByIdAndUpdate(req.user.id, {cartData:{}})

        // payment link using stripe
        const line_items = req.body.items.map((item)=>({
            price_data:{
                currency:"usd",
                product_data:{
                    name:item.name
                },
                unit_amount:item.price*100
            },
            quantity:item.quantity
        }))

        line_items.push({
            price_data:{
                currency:"usd",
                product_data:{
                    name:"Delivery Charges"
                },
                unit_amount:2*100
            },
            quantity:1
        })

        const session = await stripe.checkout.sessions.create({
            line_items:line_items,
            mode:'payment',
            success_url:`${frontend_url}/verify?success=true&orderId=${newOrder._id}&sessionId={CHECKOUT_SESSION_ID}`,
            cancel_url:`${frontend_url}/verify?success=false&orderId=${newOrder._id}`
        })

        res.json({success:true,session_url:session.url})
    } catch (error) {
        console.error("Error in placeOrder:", error); 
        if (error.type && error.raw && error.raw.message) {
            console.error("Stripe Error Details:", error.raw.message);
        }
        res.json({ success: false, message: "Error placing order" });
    }
}

export const verifyOrder = async(req,res)=>{
    const {orderId,success,sessionId} =req.query; 

    console.log("Verify Order Debug: Incoming Query Params");
    console.log("  orderId:", orderId);
    console.log("  success:", success);
    console.log("  sessionId:", sessionId);

    try {
        if(success=="true"){
            try {
                if (!sessionId || !sessionId.startsWith('cs_')) {
                    console.error("Verify Order Error: Invalid or missing sessionId:", sessionId);
                    await orderModel.findByIdAndDelete(orderId);
                    return res.json({success:false,message:"Payment verification failed: Invalid session ID."});
                }

                const session = await stripe.checkout.sessions.retrieve(sessionId);
                console.log("Verify Order : Stripe session retrieved successfully.");
                console.log("Verify Order : session.payment_intent:", session.payment_intent);

                const paymentIntentId = session.payment_intent;

                if (!paymentIntentId) {
                    console.error("Verify Order Error: Payment intent ID not found in Stripe session for sessionId:", sessionId);
                    await orderModel.findByIdAndDelete(orderId);
                    return res.json({success:false,message:"Payment verification failed: No payment intent found."});
                }

                console.log("Verify Order Debug: Updating order:", orderId, "with payment: true and transactionId:", paymentIntentId);
                const updatedOrder = await orderModel.findByIdAndUpdate(orderId, {
                    payment: true,
                    transactionId: paymentIntentId
                }, { new: true });

                if (updatedOrder) {
                } else {
                    return res.json({success:false,message:"Order not found for update."});
                }
                
                res.json({success:true,message:"paid"});

            } catch (stripeError) {
                await orderModel.findByIdAndDelete(orderId); 
                res.json({success:false,message:"Payment verification failed with Stripe."})
            }
        }else{
            await orderModel.findByIdAndDelete(orderId); 
            res.json({success:false,message:"Not Paid"})
        }
    } catch (error) {
        console.error("Error in verifyOrder (outer catch):", error);
        res.json({success:false,message:"Error verifying order"})
    }
}

export const userOrders = async(req,res)=>{
    try {
        if (!req.user || !req.user.id) {
            return res.json({ success: false, message: "Authentication required to fetch user orders." });
        }
        const userId = req.user.id;
        const orders = await orderModel.find({userId:userId}); 
        res.json({success:true,data:orders})
    } catch (error) {
        res.json({success:false,message:"Error fetching user orders"})
    }
}

export const listOrders = async (req,res)=>{
    try {
        const orders = await orderModel.find({});
        res.json({success:true,data:orders})
    } catch (error) {
        res.json({success:false,message:"Error listing orders"})
    }
}

export const updateStatus = async (req,res) =>{
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status});
        res.json({success:true,message:"Status Updated"})
    } catch (error) {
        res.json({success:false,message:"Error updating status"})
    }
}


