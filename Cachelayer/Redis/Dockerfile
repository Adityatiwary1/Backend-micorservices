FROM redis:7.2-alpine

#WORKDIR /data  already set


#COPY users.acl /usr/local/etc/redis/users.acl
VOLUME redis-data:/data

#COPY start.sh /usr/local/bin/
#RUN chmod +x /usr/local/bin/start.sh 
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
#CMD ["sh","/usr/local/bin/start.sh"]  or "sh"  "start"