require('dotenv').config();
const express =require("express");
const app =express()
const createmcpobj=require('./Utilis/mcp');
const logger=require('./Utilis/logger');
const helmet=require('helmet');
const crypto=require('crypto')
const cors=require('cors');
const { StreamableHTTPServerTransport } =require("@modelcontextprotocol/sdk/server/streamableHttp.js");


const start_mcp=async(app)=>{
    try{
        
        app.use(helmet());
        app.use(cors());
        app.use(express.json());
        const server=createmcpobj();
        const transport = new StreamableHTTPServerTransport({
                sessionIdGenerator: ()=> crypto.randomUUID(),
            });
        await server.connect(transport);
        app.post("/mcp", async (req, res) => {
            try{
           
            console.info('post endpoint hit');
            
            console.log("session:", req.headers["mcp-session-id"])
            logger.info(req.body);
            await transport.handleRequest(req, res, req.body);//await can be omitted as res is snet handlerewuts so returning here when pr resolves doesnt amke sense   
       
            }
            catch(err){
                logger.info(err.message);
                logger.error(err.message,err.name,err.stack);
                res.status(500).json({sucecss:false,msg: err.message});
            }
        
        });
        app.locals.server=app.listen(process.env.PORT, "0.0.0.0", () => {
        logger.info("MCP server running");
        });
    }
    catch(err){
        logger.error('improper startup',err.message);
        process.exit(1);

    }
    }

process.on('SIGTERM',async()=>{
   await new Promise((resolve,reject)=>{
    app.locals.server.close(resolve);
    
   })
   process.exit(1);
})
start_mcp(app);