require('dotenv').config;
const express=require('express');
const logger=require('./Utilis/logger');
const mongoose=require('mongoose');
const helmet=require('helmet');
const cors=require('cors');
const{RateLimiterRedis}=require('rate-limit-flexible');
const Redis=require('ioredis');
const app=express();
const router=require('./routes/authroutes');
const errorhandler=require('./Middleware/errorhandlerexp')
try{
await mongoose.connect(process.env.MONG0_URI);
logger.info('conncetd to db ');
}
catch(err){
logger.error('db connection error',err.message);
}

const redisclient=new Redis(process.env.REDIS_URI);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req,res,next)=>{
    logger.info(`Received ${req.method} / ${req.path}`);
    return next();
});
const ratelimiter=new RateLimiterRedis({storeClient: redisclient,keyPrefix:'userservice',points:4,duration:1})
app.use((req,res,next)=>{//why not await???, a promise is thrown and then method rusn and calls next so prev req continues
    ratelimiter.consume(req.ip).then(()=>next()).catch(()=>{
        logger.warn('ip rate limit exceeded');
        res.status(429).json({success:true,message:'Rate limit exceeded'});
    })
});
app.use('/api/auth',router);
app.use(errorhandler);


app.listen(process.env.PORT,()=>{
    logger.info('user identity service started listening');
});
process.on("unhandledRejection", (reason, promise) => {
  logger.error(reason);  
  logger.error(promise);  
});
process.on("uncaughtException", (err,origin) => {
  logger.error("Uncaught Exception:", err);

  await mongoose.disconnect();
  process.exit(1);
});