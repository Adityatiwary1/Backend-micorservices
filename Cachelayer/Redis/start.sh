set -e

envsubst < /templates/redis.template.conf > /usr/local/etc/redis/redis.conf

exec redis-server /usr/local/etc/redis/redis.conf
#quotes are not always necessary for strings in shell unless to prevent shell interpretations