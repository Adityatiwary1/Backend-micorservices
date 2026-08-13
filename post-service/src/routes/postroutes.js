const express=require('express');
const {createPost,deletePost,getpostbypostid,getallposts}=require('../Controllers/postlogic');
const auth=require('../Middleware/authmiddleware');
const validation_createpost= require('../Middleware/validationschemamid');
const router=express.Router();

router.post('/createpost',auth,validation_createpost,createPost);
router.delete('/deletepost/:id',auth,deletePost);
//router.delete('/deletepost/:ids',auth,deletePost),separatedpath params ids;router.delete('/deletepost',auth,deletePost) ids in json body
router.get('/getpost/:id',auth,getpostbypostid);
router.get('/getallposts',auth,getallposts);

module.exports=router;


