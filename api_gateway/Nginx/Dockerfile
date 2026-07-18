FROM openresty/openresty:1.29.2.4-1-alpine-fat


RUN  /usr/local/openresty/luajit/bin/luarocks install lua-resty-jwt  && \
     /usr/local/openresty/luajit/bin/luarocks install lua-resty-cookie


#COPY ./api_gateway/Nginx/new.nginx.conf /usr/local/openresty/nginx/conf/nginx.conf

#RUN which luarocks


COPY ./api_gateway/Nginx/auth.lua  /usr/local/openresty/lua/auth.lua


EXPOSE 80

CMD ["openresty", "-g", "daemon off;"]