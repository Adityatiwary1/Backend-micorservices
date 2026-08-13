FROM redis:7.2-alpine

#WORKDIR /data  already set

VOLUME ./Cachelayer/Redis/redis.conf:/usr/local/etc/redis/redis.conf
#COPY users.acl /usr/local/etc/redis/users.acl
VOLUME redis-data:/data
#need to pass path to config for redis 

CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]