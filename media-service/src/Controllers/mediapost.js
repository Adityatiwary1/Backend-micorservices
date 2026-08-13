const {upload_cloudinary_promisified,delete_from_cloudinary}=require('../Utilis/cloudinary');
const logger=require('../Utilis/logger')
const medias=require('../models/media')

const uploadmedia=async(req,res)=>{
    try{
        if(!req.file){
            logger.error('upload media missing');
            res.status(400).json({success:true,message:'upload media missing'});
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
    try{
           const post =await 
           await delete_from_cloudinary();
    }
    catch(err){
        logger.error('error deleting media',err.message);
        res.status(500).json({success:false,message:'cloudinary error'});
    }
}
module.exports={
    uploadmedia,deletemedia
}