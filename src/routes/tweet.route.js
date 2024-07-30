import { Router } from "express";
import { 
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets
 } from "../controllers/tweet.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router=Router()



router.use(verifyJWT)

router.route("/").post(createTweet)
router.route("/user/:userId").get(getUserTweets)
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet)


export default router