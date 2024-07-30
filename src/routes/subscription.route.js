import { Router } from "express";
import { 
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
 } from "../controllers/subscription.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router=Router()

router.use(verifyJWT)

router.route("/c/:channelId").post(toggleSubscription)

router.route("/subscribers").get(getUserChannelSubscribers)
router.route("/subscribed-Channels").get(getSubscribedChannels)

export default router