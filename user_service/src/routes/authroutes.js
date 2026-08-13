const express=require('express');
const {registration_schema_validator_Middleware,login_schema_validator_Middleware}=require('../Middleware/validation');
const {registeruser,loginuser,refresh,logout,verify}=require('../Controllers/identity');
const router=express.Router();


router.post('/register',registration_schema_validator_Middleware,registeruser);
router.post('/login',login_schema_validator_Middleware,loginuser);
router.post('/refresh',refresh);
router.post('/logout',logout);
router.post('/verify',verify);



module.exports=router;