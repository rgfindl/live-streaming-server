FROM alfg/nginx-rtmp

#
# Instal software
#
RUN apk add --no-cache curl ffmpeg nodejs nodejs-npm supervisor

#
# Setup nginx
#
# COPY nginx.conf /etc/nginx/nginx.conf

#
# Setup node/express app
#
RUN mkdir -p /usr/src/app

COPY src/. /usr/src/app/
RUN rm -rf /usr/src/app/node_modules
RUN npm --prefix /usr/src/app install --production /usr/src/app

# Add supervisord config
RUN mkdir /var/logs
RUN touch /var/logs/supervisord.log
RUN chmod a+rw /var/logs/supervisord.log
ADD supervisord.conf /etc/supervisord.conf

CMD ["supervisord", "--nodaemon", "-c", "/etc/supervisord.conf"]