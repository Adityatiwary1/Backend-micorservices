const logger=require('../Utilis/logger');
const {validation_schema_post}=require('../validation/validationschema')



const validation_createpost=(req,res,next)=>{
    try{
     const {error} =validation_schema_post.validate(req.body);
        if(error){
            logger.warn('validation error',error.details[0].message);
            res.status(400).json({success:false,message:error.details[0].message});
        }
        logger.info('req body validated')
        next();
    }
    catch(err){//for some unexpected error handling
        logger.error(err.message);
        res.status(500).json({success:false,message:err.message});
    }
}
module.exports=validation_createpost;