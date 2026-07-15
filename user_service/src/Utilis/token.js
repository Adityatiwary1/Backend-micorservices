const jwt=require('jsonwebtoken');
const crypto=require("crypto");
const sessions=require('../Models/session')
const logger=require('../Utilis/logger')
const generate_tokens=async(newuser)=>{//for promise rejected case and also for await to db caller of this n should wait for completion
    
    const acecss_token=jwt.sign({username:newuser.username,userid:newuser.id,type:'access',role:'user'},Process.env.JWT_SECRET,{expiresin:15*60});


/*

const generate_refresh_token=(newuser,expiresat)=>{//exp at is in unix seconds
    return jwt.sign({username:newuser.username,userid:newuser.id,exp:expiresat,type:'refresh',role:'user'},Process.env.JWT_SECRET);
}
*/
const refresh_token=crypto.randomBytes(32).toString('hex');
const expiresat= new Date();
expiresat.setMinutes(expiresat.getMinutes()+120);

await sessions.create({refresh_token,user: newuser._id,expires_at:expiresat});//thwring so it becomes promise rejected and  handled by controller which have req res//thwor is an implcit control trans
logger.info('Tokens created and stored in db');
return {access_token,refresh_token};


}
module.exports=generate_tokens;