require('dotenv').config();
const express=require('express');
const logger=require('./Utilis/logger');
const mongoose=require('mongoose');
const helmet=require('helmet');
const cors=require('cors');
const router=require('./routes/postroutes');
const errorhandler=require('./Middleware/errohandlernext');

const {publishoutbox,rabbitmqconnect}=require('./Utilis/rabbitmq');
const { createClient } = require("redis");
const app = express();
let ishealthy=false
const connectDB = async () => {
 

        const connection = await mongoose.connect(
            process.env.MONGO_URI,{
                   //serverSelectionTimeoutMS: 30000, // how long initial connection waits
                   //connectTimeoutMS: 10000,         // TCP connection timeout
                   //socketTimeoutMS: 45000,          // socket inactivity timeout
                   //heartbeatFrequencyMS: 10000,     // health check interval
                   maxPoolSize: 20,                 // connection pool size
                   minPoolSize: 5 ,
                   retryWrites: true,                  // keep connections warm
                            }
                              );       //already handles reconnection based on events
        logger.info(
            `MongoDB connected: ${connection.connection.host}`
        );
        mongoose.connection.on("error", (err) => {
                  logger.error("MongoDB error:", err);
                });
        mongoose.connection.on("disconnected", (err) => {//whole connection pool is disconnected 
                  logger.error("MongoDB error:", err);
                  ishealth=false;
                });//mongoose driver does not give control over connection logic or no of attempts like redis
                //driver + mongooose give event diconnected when a connection fails after a succesult connected event unlike redis which gives reconnecting event
        mongoose.connection.on("connected", () => {
                  logger.info("MongoDB connected");
                  ishealthy = true;
                });
        return connection;         
}
/*
const redisClient = createCluster({
  rootNodes: [
    {
      url: process.env.REDIS_URI,
    },
  ],

  defaults: {
    socket: {
      connectTimeout: 10_000,
      keepAlive: true,
      reconnectStrategy: (retries) => {
        return Math.min(50 * 2 ** retries, 3000);
      },
    },
  },

  useReplicas: true,
});
;*/
let reconnectExhausted = false;
const redisclient = createClient({
  url: process.env.REDIS_URI,

  socket: {
    connectTimeout: 10_000,

    reconnectStrategy(retries) {
      
      if (retries > 10) {
        reconnectExhausted = true;
        logger.error("Redis: max reconnect attempts reached.");
        return new Error("Redis reconnect failed too many retires");
      }

      const baseDelay = Math.min(100 * 2 ** retries, 30_000);

      
      const jitter = Math.floor(Math.random() * 500);

      return baseDelay + jitter;
    },
  },
});

redisclient.on('error', (err) => {
  if (err.message === "Redis reconnect failed too many retires") {
    logger.error('Redis  reconnecting failing');
    ishealthy=false
    return;
  }

  logger.error('Redis connection error:', err);
  //implement some kind of helath checkup here 
  //should process exit here?
});
redisclient.on("ready", () => {
  logger.info("ready");
  ishealthy=true;
});

const establishconnection=async(app)=>{
    await redisclient.connect();
    app.locals.redisclient = redisclient
    app.locals.mongooseinst=await connectDB();;
  
    app.locals.rabbitmqconnectionobj=await rabbitmqconnect();;
    
}
const startServer = async (app) => {
 try{
   await establishconnection(app,redisclient);
   
  
  
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use((req,res,next)=>{
   
    req.redisclient=redisclient;
    logger.info(`Received ${req.method} / ${req.path}`);
    return next();
      });
  app.use('/post',router);
  app.use('/health',(req, res) => {
     if(ishealthy){
        res.status(200).json({
                status: "ready"
            });
          return;
        }
        res.status(500).json({
                status: "failure"
            });
    });
  app.use(errorhandler);
  app.locals.server=app.listen(process.env.PORT, () => {
    logger.info(`Server running on port ${process.env.PORT}`);
  });
  const limit=10;
  setInterval(async () => {
    try {
        await publishoutbox(limit);
    } catch (error) {
        logger.error('outbox worker error', error.message);
    }
}, 10000);
}
 catch(err){
    logger.error(
            `Server error: ${err.message}`
        );
    
    shutdown(app,1);
 }
};

async function shutdown(app,exitcode=1) {
  logger.info("Shutting down...");
   if (app.locals.server?.listening) {
    try{
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            reject(err);
            return;
          }

          resolve();
        });
      });
     }
    
    catch(err){
           logger.error('http server shutdown error',err)
    }
  }
   if(app.locals.redisclient?.status==='isOpen'||app.locals.redisclient?.status==='isReady'){
    try{
         await app.locals.redisclient.quit(); 
    }
    catch{
        logger.error('unable to close redis connection during shutdown',err.message)
    }
   }
   if (app.locals.mongooseinst?.connection.readyState === 1){
      try{
               await app.locals.mongooseinst.connection.close();
      }
      catch(err){
                logger.error('unbale to close mongodb conn shutdown error',err.message);
      }
   }
    if (app.locals.rabbitmqconnectionobj) {
     try{

      await app.locals.rabbitmqconnectionobj.close();}
      
     catch(err){
        logger.error('unable to close rabbitmq connection during shutdown',err.message)
      }

    }  
    process.exit(exitcode)
}

process.on("SIGINT", () => shutdown(app,0));
process.on("SIGTERM", () => shutdown(app,0));

process.on("unhandledRejection", (reason, promise) => {
  logger.error(reason);  
  logger.error(promise);  
});
process.on("uncaughtException", (err,origin) => {
  logger.error("Uncaught Exception:", err);
  
   shutdown(app,1)
 
});
startServer(app);

