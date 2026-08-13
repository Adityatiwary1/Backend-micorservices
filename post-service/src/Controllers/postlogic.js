const logger=require('../Utilis/logger');
const posts=require('../models/post');
const {publish_event}=require('../Utilis/rabbitmq');

const createPost=async(req,res)=>{
    try{
        const {content,mediaIDs}=req.body;
        logger.info(`received ${mediaIDs}`)
        const post=await posts.create({user:req.user.userid,content,mediaIDs:mediaIDs||[]});
        logger.info('post created')
        await req.redisclient.set(`post:${req.user.userid}:${post._id}`,JSON.stringify(post));
        logger.info('stored in cache')
        res.status(201).json({sucess:true,message:'post created',postid:post._id,req:req.body})
    }
    catch(err){
        logger.error('post creation failed')
        res.status(500).json({sucess:true,message:'server internla error'});
    }
}
const deletePost=async(req,res)=>{
    try{
        const postid=req.params.id;//params are string
        //const deletedpost = await posts.findByIdAndDelete(postid);
        const deletedpost = await posts.findOneAndDelete({
                                           _id: postid,
                                           user: req.user.userid
                                                       });
        if(!deletedpost){
            return res.status(404).json({success:false,message:'no such post found'});
        }
        logger.info('post deleted form db');
    //publishevent before further processing ie redis cache for performance
    await publish_event('post.delete',{postid:req.params.id,userid:req.user.userid,mediaIDs:deletedpost.mediaIDs});
    logger.info('event published');
    await req.redisclient.del(`post:${req.user.userid}:${postid}`);//0 or 1 is resposn but we dont need it in any case
    
    logger.info('post deleted form cache and db and event published');
    res.status(200).json({success:true,message:'post deleted sucecssfully and event published'});

    }
    catch(err){
        logger.error('post del failed');
        res.status(500).json({success:true,message:'post deletion failed',error:err.message,naem :err.name});
    }
}
const getpostbypostid=async(req,res)=>{//postofuser
    try{
        const postid =req.params.id;
        if(!postid){
            logger.error('post id missing');
            res.status(400).json({success:false,message:'post id is missing in path params'});           
        }
        const key=`post:${req.user.userid}:${req.params.id}`;
        const postjsonstr= await req.redisclient.get(key);
        if(!postjsonstr){
                const post =await posts.findById(postid);
                if(!post){
                    logger.error('no such post exists');
                    res.status(400).json({success:false,message:`no such post with ${req.params.id}`});
                }
                await req.redisclient.set(`post:${req.user.userid}:${req.params.id}`,JSON.stringify(post));
                logger.info('post found in db and set in cache');
                res.status(201).json({success:false,message:'post found ',content:post.content,mediaIDs: post.mediaIDs});
            }
        const post = JSON.parse(postjsonstr);
        logger.info('post found in cache');
        res.status(201).json({success:false,message:'post found ',content:post.content,mediaIDs: post.mediaIDs});

        
    }
    catch(err){
       logger.error(err.message);
       res.status(500).json({success:false,message:'Server internal error'}); 
       }
}


const getallposts=async(req,res)=>{//allpostsofuser
    try{
        
    }
    catch(err){
        
    }
}
module.exports={createPost,deletePost,getpostbypostid,getallposts};
