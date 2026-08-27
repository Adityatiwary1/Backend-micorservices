FROM rabbitmq:4-management
#USER root
#COPY start.sh /usr/local/bin/start.sh

#RUN chmod +x /usr/local/bin/start.sh
USER rabbitmq

CMD ["rabbitmq-server"]
#CMD ["sh","/usr/local/bin/start.sh"]
#in production use the offical image directly for container unless you want dockerfile level changes like script.sh as cmd or entrypoint