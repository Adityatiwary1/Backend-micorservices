const logger=require('../Utilis/logger');


const auth=(req,res,next)=>{
    try{
        
        const userid=req.headers['x-user-id'];
        if(!userid){
            logger.warn('access attempted without user id');
            res.status(401).json({success:false,message:'access attempted without user id'});
        }
        req.user={userid};//not to be confused with user entry in user collection
        logger.info('auth allowed');
        
        
        
        next();
       }
    
    catch(err){
        logger.warn(err.message);
        res.status(401).json({success:false,message:err.message});

    }
}
module.exports=auth;