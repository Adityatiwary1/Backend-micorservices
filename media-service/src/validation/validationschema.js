const joi=require('joi')
const validation_schema_post_media=joi.object({
    publicid:joi.string().required(),
    cloudurl :joi.string().required(),
    originalname:joi.string().required(),
    userid:joi.string().required(),
    mimetype :joi.string().required(),
    
})
module.exports={validation_schema_post_media}