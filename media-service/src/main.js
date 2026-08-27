require('dotenv').config();
const express=require('express');
const logger=require('./Utilis/logger');
const mongoose=require('mongoose');
const helmet=require('helmet');
const cors=require('cors');

const router=require('./routes/mediaroutes');
const errorhandler=require('./Middleware/errohandlernext');
const {consume_events,rabbitmqConsumerConnect}=require("./Utilis/rabbitmq");
const {handlepostdelete}=require("./Utilis/postdelhelper")
const app = express();
let isready=false;
const connectDB = async () => {
 

        const connection = await mongoose.connect(
            process.env.MONGO_URI,{
                   //serverSelectionTimeoutMS: 30000, // how long initial connection waits
                   //connectTimeoutMS: 10000,         // TCP connection timeout
                   //socketTimeoutMS: 45000,          // socket inactivity timeout
                  // heartbeatFrequencyMS: 10000,     // health check interval
                   maxPoolSize: 20,                 // connection pool size
                   minPoolSize: 5 ,
                   retryWrites: true,                  // keep connections warm
                            }
                              );       //already handles reconnection based on events
        logger.info(
            `MongoDB connected: ${connection.connection.host}`
        );
        mongoose.connection.on("error", (err) => {
                  logger.error( err);
                });
        mongoose.connection.on("disconnected", (err) => {//whole connection pool is disconnected 
                  logger.error( err);
                  isready=false;
                });//mongoose driver does not give control over connection logic or no of attempts like redis
                //driver + mongooose give event diconnected when a connection fails after a succesult connected event unlike redis which gives reconnecting event
         mongoose.connection.on("connected", () => {
                  logger.info("MongoDB connected");
                  isready = true;
                });        
        return connection;         
}
const establishconnection=async(app)=>{
    
    app.locals.mongooseinst=await connectDB();;
  
    app.locals.rabbitmqconnectionobj=await rabbitmqConsumerConnect();;
    
}
const startServer = async (app) => {
 try{
   await establishconnection(app);
   
  
  
    app.set("trust proxy", 1);
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use((req,res,next)=>{
     
      
      logger.info(`Received ${req.method} / ${req.path}`);
      return next();
        });
    app.use('/upload',router);
    app.use('/health',(req, res) => {
      if(isready){//this is ready is set only by mongodb as it is criticla for app logic 
        //rabbitmq disconnected can be handled as we are storing evnts in db persistent so app logic can function
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
    app.locals.server=app.listen(process.env.PORT, "0.0.0.0", () => {
      logger.info(`Server running on port ${process.env.PORT}`);
    });
    const limit=10;
    setInterval(async () => {
        try {logger.info('consuming rabbitme events')
            await consume_events();
        } catch (error) {
            logger.error('consume rabbitmq event error', error.message);
        }
    }, 20000);
    setInterval(async () => {
        try {
            logger.info('running mediaid deletion')
            await handlepostdelete(limit);
        } catch (error) {
            logger.error('lazy deletion error', error.message);
        }
    }, 15000);
    
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

      await rabbitConnection.close();}
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
