require('dotenv').config();
const express=require('express');
const logger=require('./Utilis/logger');
const mongoose=require('mongoose');
const helmet=require('helmet');
const cors=require('cors');
const{RateLimiterRedis}=require('rate-limiter-flexible');
//const {rateLimit} = require("express-rate-limit");
//const {RedisStore} = require("rate-limit-redis");
const { createClient } = require("redis");
const app=express();
const router=require('./routes/authroutes');
const errorhandler=require('./Middleware/errorhandlerexp')
const cookieparser=require('cookie-parser');
const connectDB = async () => {
    try {
        const connection = await mongoose.connect(
            process.env.MONGO_URI
        );

        logger.info(
            `MongoDB connected: ${connection.connection.host}`
        );

    } catch (error) {
        logger.error(
            `MongoDB connection failed: ${error.message}`
        );

        process.exit(1);
    }
}
const redisclient = createClient({
    url: process.env.REDIS_URI
});
const startServer = async (app) => {
 try{
  await connectDB();
  await redisclient.connect();
  const ratelimiter=new RateLimiterRedis({storeClient: redisclient,keyPrefix:'userservice',points:4,duration:1, useRedisPackage: true})
 
  app.use((req,res,next)=>{//why not await???
    ratelimiter.consume(req.ip).then(()=>next()).catch((err)=>{
        logger.error(`${req.ip}`);
        logger.error(err);
        logger.warn('ip rate limit exceeded',err.message);
        res.status(429).json({success:false,message:err.message});
      })
   });
   app.use((req,res,next)=>{
    logger.info(`Received ${req.method} / ${req.path}`);
    return next();
    });
  app.listen(process.env.PORT, () => {
    logger.info(`Server running on port ${process.env.PORT}`);
  });
}
 catch(err){
    logger.error(
            `Server error: ${err.message}`
        );

        process.exit(1);
 }
};



redisclient.on("connect", () => {
    logger.info("Redis connected");
});

redisclient.on("ready", () => {
    logger.info("Redis ready");
});

redisclient.on("error", (err) => {
    logger.error(`Redis error: ${err.message}`);
});

redisclient.on("close", () => {
    logger.warn("Redis connection closed");
});

redisclient.on("reconnecting", () => {
    logger.warn("Redis reconnecting");
});

app.set("trust proxy", 1);//better to use container ip of proxy and based on no of proxy hops  #no of hop as if haeder is appended lb-nginx-service 2 hops if appended then the first hop in2 hops would e th ecliet ip so trust proxy,2
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieparser());

/*
const limiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 100, 

   standardHeaders: true,
   legacyHeaders: false,

  store: new RedisStore({
    sendCommand: (...args) => redisclient.sendCommand(args),
     }),

  message: {
    error: "Too many requests, please try again later.",
      },
       });

  app.use(limiter);
*/

app.use('/auth',router);
app.use(errorhandler);


startServer(app);
process.on("unhandledRejection", (reason, promise) => {
  logger.error(reason);  
  logger.error(promise);  
});
process.on("uncaughtException", (err,origin) => {
  logger.error("Uncaught Exception:", err);
  
  process.exit(1);
});