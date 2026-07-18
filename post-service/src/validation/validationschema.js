const joi=require('joi')
const validation_schema_post=joi.object({
    content:joi.string().min(4).max(100).required(),
    mediaIDs:joi.array().items(joi.string().min(4))
    
})
module.exports={validation_schema_post}