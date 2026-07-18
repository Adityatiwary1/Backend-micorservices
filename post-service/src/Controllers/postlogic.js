const logger=require('../Utilis/logger');
const posts=require('../models/post');


const createPost=async(req,res)=>{
    try{
        const {content,mediaIDs}=req.body;
        await posts.create({user:req.user.userid,content,mediaIDs:mediaIDs||[]});
        logger.info('post created')
        res.status(201).json({sucess:true,message:'post created'})
    }
    catch(err){
        logger.error('post creation failed')
        res.status(500).json({sucess:true,message:'server internla error'});
    }
}
const deletePost=async(req,res)=>{
    try{
        
    }
    catch(err){
        
    }
}
const getpost=async(req,res)=>{//postofuser
    try{
        
    }
    catch(err){
        
    }
}
const getallposts=async(req,res)=>{//allpostsofuser
    try{
        
    }
    catch(err){
        
    }
}
module.exports={createPost,deletePost,getpost,getallposts};
