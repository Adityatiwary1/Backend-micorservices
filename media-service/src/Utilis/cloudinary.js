const cloudinary = require('cloudinary').v2;
const logger=require('../Utilis/logger');
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUD_API_KEY, 
  api_secret:process.env.CLOUD_API_SECRET
});
const upload_cloudinary_promisified=(file)=>{
    return new Promise((resolve,reject)=>{
        const uploadstream=cloudinary.uploader.upload_stream(
            {
                resource_type:'auto'
            },
            (err,result)=>{
                      if(err){
                        logger.error('failed to upload',err.message);
                        reject(err);
                        
                      }
                      else{
                        logger.info('upload successfull to cloudinary');
                        resolve(result);
                      }
            }
        )
        uploadstream.end(file.buffer);
    })
};
const delete_from_cloudinary=async(publicidcloudinary)=>{
  try{
    const res= await cloudinary.uploader.destroy(publicidcloudinary);
    return res;//can return not found but that sbhould not cause problem in our app logic so no extra handling for this case
  }
  catch(err){
     logger.error('delete unsuccessfull');
     throw err;
  }
}

module.exports={upload_cloudinary_promisified,delete_from_cloudinary};