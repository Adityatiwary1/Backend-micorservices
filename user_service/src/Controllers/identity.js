const expresss=require('express')
const user =require('../Models/Users')
const sessions=require('../Models/session')
const logger=require('../Utilis/logger')

const {Authcookies,Clearcookies}=require('../Utilis/cookieattributes')


const registeruser=async(req,res)=>{
    try{
    
    const{username,email,password}=req.body;
    const checkuser=await user.findOne({$or:[{email},{username}]});
    
    if(checkuser){
        logger.warn('user laredy exists')
        return res.status(400).json({success:false,message:'username or email already exists'})
    }
    const newuser=new user({username,email,password});
    await newuser.save();
    logger.info('User registered',newuser._id);
    //await Authcookies(res,newuser);
    res.status(201).json({success:true,message:'user Registered successfully'})

    

    }
    catch(err){
        logger.error('user registration failed',err.name);
        res.status(500).json({success:false,message:'Internal Server error'});
    }
}
const loginuser=async(req,res)=>{
    try{
        const{email,password}=req.body;
        const checkuser=await user.findOne({email});
    
        if(!checkuser){
         logger.warn(`no user exists with ${email}`);
         return res.status(401).json({success:false,message:'username or email already exists'});
        }
        const isvalidpassword=await checkuser.comparepassword(password);
        if(!isvalidpassword){
         logger.warn(`invalid password`);
         return res.status(401).json({success:false,message:'invalid password'});
        }
        await Authcookies(res,checkuser);
        res.status(201).json({success:true,message:'login successfull'});


    }
    catch(err){
        logger.error('user login failed',err.message);
        res.status(500).json({success:false,message:'Internal Server error'});
    } 
    }

const refresh=async(req,res)=>{
    try{
         logger.info(req.headers);
         const refresh_token = req.cookies.REFRESH_COOKIE;
         if(!refresh_token){//undefined or '' str as header values are str
            logger.warn(`refresh_token missing `);
            return res.status(401).json({success:false,message:'refresh_token missing'});
         }
         const session=await sessions.findOne({refresh_token});
         if(!session){//||session.expires_at<Date.now()
            logger.warn(`refresh_token invalid`);
            return res.status(401).json({success:false,message:'refresh_token invalid'});
         }
         if(session.expires_at< new Date()){
            logger.warn(`refresh_token expired`);
            return res.status(401).json({success:false,message:'refresh_token expired'});

         }
         const userfound=await user.findById(session.user);
         if(!userfound){//maybe deleted from db or using a exp token which was not deleted from db
            logger.warn('user not found');
            return res.status(401).json({success:false,message:'user not found'});
         }
         await Authcookies(res,userfound);
         await sessions.deleteOne({_id:session._id});
         res.status(201).json({success:true,message:'refresh successfull'});

    }
    catch(err){
          logger.error('refersh failed',err.message);
          res.status(500).json({success:false,message:'refresh failed'});
    }
}
 const logout=async(req,res)=>{
    try{
            await Clearcookies(req.res);
            logger.info('logout');
            res.status(201).json({success:true,message:'logout successfull'});


    }
    catch(err){
        logger.error('logout failed',err.message);
        res.status(500).json({success:false,message:'logout failed'});

    }
 }
 const verify=async(req,res)=>{
    try{
        const access_token=req.cookies.REFRESH_COOKIE;
        if(!access_cookie){
            logger.warn('refresh_token missing');
            res.status(401).json({success:false,message:'refresh_token missing'});
        } 
        const decoded = jwt.verify(access_token,process.env.JWT_SECRET);
        const user_id=decoded.userid;
        const finduser=await user.findById(user_id)//str is convt to object id if inavlid caste rror is thrown
        if(!finduser){//if user deleted or does not exist
            logger.warn('no such user of jwt apyload');
            res.status(401).json({success:false,message:'no such user'}); 
        }
        res.set('X-User-Id',user_id);//haeder values must be string
        logger.info('verified');
        res.status(201).json({success:true,message:'verification successfull'});


    }
    catch(err){
        logger.warn(err.message);
        res.status(401).json({success:false,message:err.message});
    }
 }
  const health=async(req,res)=>{
    try{

    }
    catch(err){
        
    }
  }
module.exports={registeruser,loginuser,refresh,logout,verify};