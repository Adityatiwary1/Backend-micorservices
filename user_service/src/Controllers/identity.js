const expresss=require('express')
const user=require('../Models/Users')
const logger=require('../Utilis/logger')

const {Authcookies,Clearcookies}=require('../Utilis/cookieattributes')


const registeruser=(req,res)=>{
    try{
    
    const{username,email,password}=req.body;
    const checkuser=await user.findOne({$or:[{email},{username}]});
    
    if(checkuser){
        logger.warn('user laredy exists')
        return res.status(400).json({success:true,message:'username or email already exists'})
    }
    const newuser=new user({username,email,password});
    await newuser.save();
    logger.info('User registered',newuser._id);
    //await Authcookies(res,newuser);
    res.status(201).json({success:true,message:'user Registered successfully'})

    

    }
    catch(err){
        logger.error('user registration failed',err.message);
        res.status(500).json({success:true,message:'Internal Server error'});
    }
}
module.export={registeruser};