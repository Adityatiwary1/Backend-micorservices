const generate_tokens=require('../Utilis/token');

const access_attributes={
    httpOnly:process.env.COOKIE_HTTP,
    secure : process.env.COOKIE_SECURE,
    sameSite :process.env.COOKIE_SITE,
    maxAge:15*60*1000,
}
const refresh_attributes={
    httpOnly:process.env.COOKIE_HTTP,
    secure : process.env.COOKIE_SECURE,
    sameSite :process.env.COOKIE_SITE,
    maxAge:2*60*60*1000,
};
const Authcookies=async(res,newuser)=>{
    const {access_token,refresh_token}= await generate_tokens(newuser);
    res.cookie(ACCESS_COOKIE,access_token,access_attributes);
    res.cookie(REFRESH_COOKIE,refresh_token,refresh_attributes);//note exp time ofcookie si more thant exp time of token  to chanhe it use exp prop with customized expt time in payload fo jwt

};
const Clearcookies=async(req,res)=>{
    res.clearCookie(ACCESS_COOKIE,access_attributes);
    res.clearCookie(REFRESH_COOKIE,refresh_attributes);
    req
};
module.exports={Authcookies,Clearcookies};
