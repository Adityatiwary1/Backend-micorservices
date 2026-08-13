const logger=require('../Utilis/logger');
//const {validation_schema_post_media}=require('../validation/validationschema.js')

const auth=async(req,res,next)=>{
    try{
        
        const userid=req.headers['x-user-id'];
        if(!userid){
            logger.warn('access attempted without user id');
            res.status(401).json({success:false,message:'access attempted without user id'});
        }
        req.user={userid};//not to be confused with user entry in user collection
        logger.info('auth allowed');
        
        /*const {error} =validation_schema_post_media.validate(req.body);
        if(error){
            logger.warn('validation error',error.details[0].message);
            res.status(400).json({success:true,message:'invalid request body'});
        }
        */
        next();
       }
    
    catch(err){
        logger.warn(err.message);
        res.status(401).json({success:false,message:err.message});

    }
}
module.exports=auth;