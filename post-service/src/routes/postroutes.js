const express=require('express');
const {createPost,deletePost,getpost,getallposts}=require('../Controllers/postlogic');
const auth=require('../Middleware/authmiddleware');

const router=express.Router();

router.post('/createpost',auth,createPost);
router.post('/',auth,deletePost);
router.get('/',auth,getpost);
router.get('/',auth,getallposts);

module.exports=router;


