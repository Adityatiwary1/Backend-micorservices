require('dotenv').config();
const express=require('express');
const logger=require('./Utilis/logger');
const mongoose=require('mongoose');
const helmet=require('helmet');
const cors=require('cors');
const router=require('./routes/postroutes');
const errorhandler=require('./Middleware/errohandlernext');
const auth=require('./Middleware/authmiddleware');
const rabbitmqinstance=require('./Utilis/rabbitmq');
const { createClient } = require("redis");
const app = express();
const connectDB = async () => {
 

        const connection = await mongoose.connect(
            process.env.MONGO_URI,{
                   serverSelectionTimeoutMS: 30000, // how long initial connection waits
                   connectTimeoutMS: 10000,         // TCP connection timeout
                   socketTimeoutMS: 45000,          // socket inactivity timeout
                   heartbeatFrequencyMS: 10000,     // health check interval
                   maxPoolSize: 20,                 // connection pool size
                   minPoolSize: 5 ,
                   retryWrites: true,                  // keep connections warm
                            }
                              );       //already handles reconnection based on events
        logger.info(
            `MongoDB connected: ${connection.connection.host}`
        );
        return true;     
   
}
let reconnectExhausted = false;
const redisclient = createClient({
  url: process.env.REDIS_URI,

  socket: {
    connectTimeout: 10_000,

    reconnectStrategy(retries) {
      
      if (retries > 100) {
        reconnectExhausted = true;
        console.error("Redis: max reconnect attempts reached.");
        return new Error("Redis reconnect failed");
      }

      const baseDelay = Math.min(100 * 2 ** retries, 30_000);

      
      const jitter = Math.floor(Math.random() * 500);

      return baseDelay + jitter;
    },
  },
});
redisclient.on("error", (err) => {
  logger.error(err);

  if (reconnectExhausted) {
    logger.error("Redis is unavailable. Exiting...");
    process.exit(1);
  }
});
const startServer = async (app,redisclient) => {
 try{
  await connectDB();
  await rabbitmqinstance.connect();
  await redisclient.connect();
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use((req,res,next)=>{
    req.redisclient = redisclient;
    req.rabbitmqinstance=rabbitmq;
    logger.info(`Received ${req.method} / ${req.path}`);
    return next();
      });
  app.use('/post',router);
  app.use(errorhandler);
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






startServer(app,redisclient);

process.on("unhandledRejection", (reason, promise) => {
  logger.error(reason);  
  logger.error(promise);  
});
process.on("uncaughtException", (err,origin) => {
  logger.error("Uncaught Exception:", err);

  
  process.exit(1);
});

