require('dotenv').config();
const express=require('express');
const logger=require('./Utilis/logger');
const mongoose=require('mongoose');
const helmet=require('helmet');
const cors=require('cors');

const router=require('./routes/mediaroutes');
const errorhandler=require('./Middleware/errohandlernext');

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
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors());

  app.use((req,res,next)=>{
    logger.info(`Received ${req.method} / ${req.path}`);
    return next();
    });
  app.use('/upload',router);
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

startServer(app);

process.on("unhandledRejection", (reason, promise) => {
  logger.error(reason);  
  logger.error(promise);  
});
process.on("uncaughtException", (err,origin) => {
  logger.error("Uncaught Exception:", err);

  
  process.exit(1);
});
