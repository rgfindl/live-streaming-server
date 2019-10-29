FROM tiangolo/nginx-rtmp

#
# Instal software
#
RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash
RUN apt-get install -y ffmpeg nodejs npm supervisor

#
# Setup nginx
#
COPY nginx.conf /etc/nginx/nginx.conf

#
# Setup node/express app
#
RUN mkdir -p /usr/src/app

COPY src/. /usr/src/app/
RUN rm -rf /usr/src/app/node_modules
RUN npm --prefix /usr/src/app install --production /usr/src/app

# Add run script
ADD run.sh /etc/nginx/run.sh
RUN chmod +x /etc/nginx/run.sh

# Add supervisord config
RUN mkdir /var/logs
RUN touch /var/logs/supervisord.log
RUN chmod a+rw /var/logs/supervisord.log
ADD supervisord.conf /etc/supervisor/conf.d/supervisord.conf

CMD ["/etc/nginx/run.sh"]