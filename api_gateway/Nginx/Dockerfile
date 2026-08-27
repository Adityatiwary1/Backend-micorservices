FROM openresty/openresty:1.29.2.4-1-alpine-fat


RUN  /usr/local/openresty/luajit/bin/luarocks install lua-resty-jwt  && \
     /usr/local/openresty/luajit/bin/luarocks install lua-resty-cookie




#RUN which luarocks


COPY ./api_gateway/Nginx/auth.lua  /usr/local/openresty/lua/auth.lua
#COPY start.sh /usr/local/bin/          copy in binfodler with exact name folder contents survive

#RUN chmod +x /usr/local/bin/start.sh

EXPOSE 80

CMD ["openresty", "-g", "daemon off;"]
#CMD ["sh","/usr/local/bin/start.sh"]  or "sh"  "start"