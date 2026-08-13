set -e

envsubst < /templates/rabbitmq.template.conf > /etc/rabbitmq/rabbitmq.conf

exec rabbitmq-server