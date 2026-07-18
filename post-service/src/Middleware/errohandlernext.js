const logger=require('../Utilis/logger.js');


const errorhandler=async(err,req,res,next)=>{
    logger.error(err.stack);
    res.status(err.status||500).json({
        success:false,
        message:err.message||'server internal error',
    });

}
module.exports=errorhandler;
