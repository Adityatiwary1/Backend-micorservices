set -e

envsubst < /templates/rabbitmq.template.conf > /etc/rabbitmq/rabbitmq.conf

exec openresty -g "daemon off;"