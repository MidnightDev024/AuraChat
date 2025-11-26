import express from 'express';
import { signup, login, checkAuth, updateProfile, getVapidKey, savePushSubscription, removePushSubscription } from '../controllers/userController.js';
import { protectRoute } from '../middleware/auth.js';

const userRouter = express.Router()

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.get("/check", protectRoute, checkAuth);
userRouter.put("/updateProfile", protectRoute, updateProfile);

// Push notification endpoints
userRouter.get("/vapid-key", getVapidKey);
userRouter.post("/push-subscription", protectRoute, savePushSubscription);
userRouter.delete("/push-subscription", protectRoute, removePushSubscription);

export default userRouter;