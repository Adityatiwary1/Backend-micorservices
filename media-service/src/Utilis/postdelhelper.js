const Mediadelcloud=require("../models/cloudinarypublicid")
const {delete_from_cloudinary}=require("../Utilis/cloudinary")
const logger=require("../Utilis/logger")
const handlepostdelete=async(limit)=>{
    const entries = await Mediadelcloud.find({ status: 'pending' }).limit(limit);
     if (entries.length === 0) { logger.info('no media to delete');
    return}
    logger.info('found events');
    const publicIds = entries.map(entry => entry.publicid);
    for(const publicid of publicIds){
        try{
           await delete_from_cloudinary(publicid);
           logger.info(`deleted form cloud id ${publicid}`)
           await Mediadelcloud.updateOne(
                    { publicid },
                    { $set: { status: "published" } }
                    )
           logger.info(`deleted form cloud id ${publicid} and updated status`)
        }
        catch(err){
             logger.error('failed to del media from cloudinary',err.message);
        }
    }
}
module.exports={handlepostdelete};