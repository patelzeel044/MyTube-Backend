import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistById,
    getUserPlaylists,
 } from "../controllers/playlist.controller.js";


const router=Router()



router.use(verifyJWT)


router.route("/user/:userId").get(getUserPlaylists)

router.route("/create-playlist").post(createPlaylist)


router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);


router.route("/add/:videoId/:playlistId")
      .patch(addVideoToPlaylist);
      
router.route("/remove/:videoId/:playlistId")
      .patch(removeVideoFromPlaylist);




export default router