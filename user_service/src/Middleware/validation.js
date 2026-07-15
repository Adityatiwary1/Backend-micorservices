const joi=require('joi');
const registration_schema=require('../validation/validationschema');
const registration_schema_validator_Middleware=(req,res,next)=>{//this error inherits from Error clas has message stack
     const {error}=registration_schema.validate(req.body);
     if(error){//beter to modify the error an merge detail array all message into one and create a new error object  
        error.status=400;
        logger.warn('validation error',error.details)
        return res.status(400).json({success:false,
         message:'invalid req body'
        })
     }
     return next();
}
module.export={registration_schema_validator_Middleware};