set -e

envsubst < /templates/nginx.template.conf > /usr/local/openresty/nginx/conf/nginx.conf

exec openresty -g "daemon off;"