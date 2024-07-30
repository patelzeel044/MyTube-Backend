import express from 'express'
import cors from "cors"
import cookieParser from 'cookie-parser'

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"2mb"}))
app.use(express.urlencoded({extended:true, limit:"2mb"}))
app.use(express.static("public"))
app.use(cookieParser())



import userRouter from "./routes/user.route.js"
import tweetRouter from "./routes/tweet.route.js"
import commentRouter from "./routes/comment.route.js"
import likeRouter from "./routes/like.route.js"
import playlistRouter from "./routes/playlist.route.js"
import subscriptionRouter from "./routes/subscription.route.js"
import dashboardRouter from "./routes/dashboard.route.js"
import healthcheckRouter from "./routes/healthcheck.route.js"
import videoRouter from "./routes/video.route.js"




app.use("/api/v1/users",userRouter)
app.use("/api/v1/tweet",tweetRouter)
app.use("/api/v1/comment",commentRouter)
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/playlist",playlistRouter)
app.use("/api/v1/subscriptions",subscriptionRouter)
app.use("/api/v1/dashboard",dashboardRouter)
app.use("/api/v1/healthcheck",healthcheckRouter)
app.use("/api/v1/video",videoRouter)



export {app}