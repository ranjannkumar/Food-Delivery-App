
    import userModel from '../models/userModel.js';

    // Add food item to user cart
    export const addToCart = async (req, res) => {
        try {
            if (!req.user || !req.user.id) {
                console.log("addToCart Error: User ID not available from authMiddleware.");
                return res.json({ success: false, message: "Authentication required." });
            }
            const userId = req.user.id; 

            let userData = await userModel.findById(userId);

            if (!userData) {
                return res.json({ success: false, message: "User not found in database." });
            }

            let cartData = userData.cartData;
            if (!cartData[req.body.itemId]) {
                cartData[req.body.itemId] = 1;
            } else {
                cartData[req.body.itemId] += 1;
            }
            await userModel.findByIdAndUpdate(userId, { cartData });
            res.json({ success: true, message: "Added To Cart" });
        } catch (error) {
            res.json({ success: false, message: "Error adding to cart." });
        }
    };

    // Remove food item from user cart
    export const removeFromCart = async (req, res) => {
        try {
            if (!req.user || !req.user.id) {
                return res.json({ success: false, message: "Authentication required." });
            }
            const userId = req.user.id; 

            let userData = await userModel.findById(userId);

            if (!userData) {
                return res.json({ success: false, message: "User not found in database." });
            }

            let cartData = userData.cartData;
            if (cartData[req.body.itemId] > 0) {
                cartData[req.body.itemId] -= 1;
            }
            await userModel.findByIdAndUpdate(userId, { cartData });
            res.json({ success: true, message: "Removed From Cart" });
        } catch (error) {
            res.json({ success: false, message: "Error removing from cart." });
        }
    };

    // Fetch user cart data
    export const getCart = async (req, res) => {
        try {
            if (!req.user || !req.user.id) {
                return res.json({ success: false, message: "Authentication required." });
            }
            const userId = req.user.id; 

            let userData = await userModel.findById(userId);

            if (!userData) {
                return res.json({ success: false, message: "User not found in database." });
            }

            let cartData = userData.cartData;
            res.json({ success: true, cartData });
        } catch (error) {
            res.json({ success: false, message: "Error getting cart." });
        }
    };

