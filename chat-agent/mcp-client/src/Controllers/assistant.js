const { HumanMessage } =require("@langchain/core/messages");
const logger= require('../Utilis/logger')

const getresponse=async(req,res)=>{
    try{
      const userid=req.user.userid;
      const graph=req.graph;
      const config = {
            configurable: {
                thread_id: userid,
             }
            };
        
      const msg= req.body.message;
      const result = await graph.invoke(
                        {
                            messages: [
                            new HumanMessage({
                                content: msg,
                            }),
                            ],
                        },
                     /*   {
                            configurable: {
                            thread_id: userid,
                            },
                        }*/
                        );
      const lastMessage = result.messages[result.messages.length - 1];
      logger.info('response successfull');
      res.status(201).json({success:true,message: lastMessage.content});
    }
    catch(err){
        logger.error(err.message);
        res.status(500).json({success:false,message: err.message});
    }
      
}
module.exports={getresponse};