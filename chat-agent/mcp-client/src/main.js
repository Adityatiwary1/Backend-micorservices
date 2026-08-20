require('dotenv').config();
const express=require('express');
const logger=require('./Utilis/logger');
const helmet=require('helmet');
const cors=require('cors');
const router=require('./routes/agent-routes');
const errorhandler=require('./Middleware/errohandlernext');
const {connectMCP}=require('./Utilis/mcp-client-setup');
const app=express();

const startServer = async (app) => {
 try{
  const {graph,mcpclient,redisclient}=await connectMCP();
  app.locals.mcpclient=mcpclient;
  app.locals.redisclient=redisclient;
  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use((req,res,next)=>{
    req.graph = graph;
    
    logger.info(`Received ${req.method} / ${req.path}`);
    return next();
      });
  app.use('/assistant',router);
  app.use(errorhandler);
  app.locals.server=app.listen(process.env.PORT, () => {
    logger.info(`Server running on port ${process.env.PORT}`);
  });
}
 catch(err){
    logger.error(
            `Server error: ${err.message}`
        );
        shutdown(app,err.obj);//not passing server if tehir sieror in server starting then we should exit sevrer.close will agian givee error
        
 }
};
process.on("SIGINT", () => shutdown(app));
process.on("SIGTERM", () => shutdown(app));

async function shutdown(app,improperstartobj) {
  logger.info("Shutting down...");
  let server,mcpclient,redisclient;
    if(improperstartobj){
        server =app.locals.server 
        mcpclient =app.locals.mcpclient;
        redisclient =app.locals.redisclient;
    }
    else{//some will be undefiend due to improepr start up close
        server =improperstartobj.server 
        mcpclient =improperstartobj.mcpclient;
        redisclient =improperstartobj.redisclient;
    
    }

    try {
        if(server){
        await new Promise((resolve) => server.close(resolve));
        }
        // Close MCP client
        if (mcpclient) {
            await mcpclient.close();
        }

        // Close Redis connection
        if (redisclient?.status==='ready') {
            await redisClient.quit();
        }
    } catch (err) {
      logger.error(err);
      process.exit(1);
    }
  
    process.exit(1)
}
    
startServer(app);

