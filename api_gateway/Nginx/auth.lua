local cookie = require "resty.cookie"
local jwt = require "resty.jwt"
local secret = os.getenv("JWT_SECRET")

-- Read cookie
local ck, err = cookie:new()
if not ck then
    ngx.log(ngx.ERR, "Failed to create cookie object: ", err)
    return ngx.exit(ngx.HTTP_INTERNAL_SERVER_ERROR)
end

local token, err = ck:get("ACCESS_COOKIE")
if not token then
    ngx.log(ngx.WARN, "ACCESS_COOKIE not found")
    return ngx.exit(ngx.HTTP_UNAUTHORIZED)
end

-- Verify JWT
local jwt_obj = jwt:verify(secret, token)

if not jwt_obj.verified then
    ngx.log(ngx.WARN, "Invalid JWT: ", jwt_obj.reason)
    return ngx.exit(ngx.HTTP_UNAUTHORIZED)
end

-- Extract userid
local userid = jwt_obj.payload.userid

if not userid then
    ngx.log(ngx.WARN, "userid missing from JWT payload")
    return ngx.exit(ngx.HTTP_UNAUTHORIZED)
end

-- Forward to upstream
ngx.req.set_header("X-User-ID", tostring(userid))