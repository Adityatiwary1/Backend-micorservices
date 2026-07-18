require('dotenv').config();
const express=require('express');
const logger=require('./Utilis/logger');
const mongoose=require('mongoose');
const helmet=require('helmet');
const cors=require('cors');

const router=require('./routes/postroutes');
const errorhandler=require('./Middleware/errohandlernext');
const auth=require('./Middleware/authmiddleware');
const app = express();
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
const startServer = async (app) => {
 try{
  await connectDB();

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


//const redisclient=new Redis(process.env.REDIS_URI);
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors());
app.use(express.json());
//app.use(cookieparser());
app.use((req,res,next)=>{
    logger.info(`Received ${req.method} / ${req.path}`);
    return next();
});
app.use('/post',router);
app.use(errorhandler);
startServer(app);

process.on("unhandledRejection", (reason, promise) => {
  logger.error(reason);  
  logger.error(promise);  
});
process.on("uncaughtException", (err,origin) => {
  logger.error("Uncaught Exception:", err);

  // mongoose.disconnect();
  process.exit(1);
});

