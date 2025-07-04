    import jwt from 'jsonwebtoken';

    const authMiddleware = async (req, res, next) => {
        const token = req.headers.token; 

        if (!token) {
            return res.json({ success: false, message: "Not Authorized, Login Again" });
        }

        try {
            const token_decode = jwt.verify(token, process.env.JWT_SECRET);

            if (!token_decode || !token_decode.id) {
                return res.json({ success: false, message: "Invalid token structure or missing user ID." });
            }

            req.user = { id: token_decode.id }; 
            
            console.log("Auth Debug: Successfully decoded token. User ID set to:", req.user.id);
            next();

        } catch (error) {
            return res.json({ success: false, message: "Authentication failed: Invalid or expired token." });
        }
    };

    export default authMiddleware;
    