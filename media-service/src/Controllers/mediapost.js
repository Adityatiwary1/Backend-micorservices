const {upload_cloudinary_promisified,delete_from_cloudinary}=require('../Utilis/cloudinary');
const logger=require('../Utilis/logger')
const medias=require('../models/media')

const uploadmedia=async(req,res)=>{
    try{
        if(!req.file){
            logger.error('upload media missing');
            res.status(400).json({success:true,message:'upload media missing'});
            return;
        }
        const{originalname,mimetype,buffer}=req.file;
        const userid= req.user.userid;
        cloudinaryres= await upload_cloudinary_promisified(req.file);
        const mediaobj=await medias.create({publicid :cloudinaryres.public_id,cloudurl:cloudinaryres.secure_url,userid,originalname,mimetype});
        logger.info('media uploaded successfuly')
        res.status(201).json({
            success:true,message:'media uploaded',mediaID:mediaobj._id,secure_url:mediaobj.cloudurl
        })
        }
    catch(err){
         logger.error('upload failed',err.message);
         res.status(500).json({success:false,message: err.message,name :err.name});
    }

}
const deletemedia =async(req,res)=>{
    try{   const session = await mongoose.startSession();
           const mediaid=req.params.id;
           await session.withTransaction(async () => {
                   const media= await Media.findByIdAndDelete(mediaId,{ session } ); 

                   if (!media) {
                        return res.status(404).json({ message: "Media not found" });
                        }
                    
                    const publicId = media.publicid;
                    await Mediadelcloud.create({
                                publicid: publicId
                            },{ session } );
                        }       )
            res.status(201).json({//lazy deletion
            success:true,message:'media deleted'
        }) 
          logger.info('media stored in delete db');
    }
    catch(err){
        logger.error('error deleting media',err.message);
        res.status(500).json({success:false,message:'cloudinary error'});
    }
    finally {
        await session.endSession();  //in both cases try or catch i have to end this session
    }
}
module.exports={
    uploadmedia,deletemedia
}