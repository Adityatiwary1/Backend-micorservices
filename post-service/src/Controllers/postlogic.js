const logger=require('../Utilis/logger');
const posts=require('../models/post');
const {publish_event}=require('../Utilis/rabbitmq');

const mongoose=require('mongoose');
const Outbox=require("../models/rabbitevent");
const createPost=async(req,res)=>{
    try{
        const {content,mediaIDs}=req.body;
        logger.info(`received ${mediaIDs}`)
        const post=await posts.create({user:req.user.userid,content,mediaIDs:mediaIDs||[]});
        logger.info('post created')
        try{
            await req.redisclient.set(`post:${req.user.userid}:${post._id}`,JSON.stringify(post));
            logger.info('stored in cache')
        }
        catch(err){
            logger.error('cache layer error at api createPost',err.message);
        }
        res.status(201).json({sucess:true,message:'post created',postid:post._id,req:req.body})
    }
    catch(err){
        logger.error('post creation failed')
        res.status(500).json({sucess:true,message:'server internal error'});
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
         let postjsonstr=undefined;
         try{
               postjsonstr= await req.redisclient.get(key);
         }
         catch(rediserror){
               logger.error('redis cache get error',rediserror)
         }
        if(!postjsonstr){
                const post =await posts.findById(postid);
                if(!post){
                    logger.error('no such post exists');
                    res.status(400).json({success:false,message:`no such post with ${req.params.id}`});
                }
                //better to make this cache storing not tied to api endpoint
                try{
                   await req.redisclient.set(`post:${req.user.userid}:${req.params.id}`,JSON.stringify(post));
                }
                catch(err){
                    logger.error('unable to set post in cache',err.message);
                }
                logger.info('post found in db');
                res.status(201).json({success:true,message:'post found ',content:post.content,mediaIDs: post.mediaIDs});
            }
        const post = JSON.parse(postjsonstr);
        logger.info('post found in cache');
        res.status(201).json({success:true,message:'post found ',content:post.content,mediaIDs: post.mediaIDs});

        
    }
    catch(err){
       logger.error(err.message);
       res.status(500).json({success:false,message:'Server internal error'}); 
       }
}

const deletePost = async (req, res) => {
         let session=null;

    try {
        session = await mongoose.startSession();
        const postid = req.params.id;
        const userid = req.user.userid;

        let deletedpost;

        await session.withTransaction(async () => {

            // 1. Delete post
            deletedpost = await posts.findOneAndDelete(
                {
                    _id: postid,
                    user: userid
                },
                { session } //session has to be sent for server to know this is part of transaction not independent
            );

            if (!deletedpost) {
                const error = new Error('POST_NOT_FOUND');//this error propogates as with trnascation itself awaits 
                throw error;
            }

            logger.info('post deleted from db');

            // 2. DON'T publish to RabbitMQ here.
            // Instead save event in Outbox database.//better pattern to publish them in future 
            //loose coupling my api endpoint is not tightly coupled with publish
             //while storing generate a unique id while creating the db entry of event event creation is in transaction so one uniue id for every event creation

            await Outbox.create(
                [
                    {
                        eventType: 'post.delete',

                        payload: {
                            postid: postid,
                            userid: userid,
                            mediaIDs: deletedpost.mediaIDs
                        },

                        status: 'pending'
                    }
                ],
                { session }
            );

            logger.info('post.delete event saved in outbox');
        });

        // 3. Redis is only cache.
        // MongoDB transaction has already succeeded.
        try {
            await req.redisclient.del(
                `post:${userid}:${postid}`
            );

            logger.info('post deleted from redis cache');

        } catch (redisError) {
            // Redis failure should normally NOT undo the DB transaction.
            //Also API endpoint should also not give usuccessfull response ie why nested try and catch
            logger.error(
                'redis cache invalidation failed',
                redisError
            );
        }

        // 4. API does NOT wait for RabbitMQ.
        return res.status(200).json({
            success: true,
            message: 'post deleted successfully'
        });

    } catch (error) {

       logger.error('post del failed');
       res.status(500).json({success:false,message:'post deletion failed',error:error.message,name :error.name});

    } finally {
        if(session){
           await session.endSession();  //in both cases try or catch i have to end this session
        }
    }
};

const getallposts=async(req,res)=>{//allpostsofuser
    try{
        
    }
    catch(err){
        
    }
}
module.exports={createPost,deletePost,getpostbypostid,getallposts};
/*
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
}*/