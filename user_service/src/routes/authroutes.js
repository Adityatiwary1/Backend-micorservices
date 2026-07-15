const express=require('express');
const {registration_schema_validator_Middleware}=require('../Middleware/validation');
const {registeruser}=require('../Controllers/identity');
const router=express.Router();

router.post('/register',registration_schema_validator_Middleware,registeruser);
module.exports=router;