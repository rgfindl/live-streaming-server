FROM haproxy:2.1

# Install deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends python-pip curl unzip cron
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get install -y nodejs

# Add HAProxy template
ADD index.js /index.js
ADD package.json /package.json
RUN npm install

# Add HAProxy entrypoint
COPY docker-entrypoint.sh /
RUN chmod a+x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

# Copy configs
COPY haproxy.cfg.template /usr/local/etc/haproxy/haproxy.cfg.template
COPY healthcheck.http /usr/local/etc/haproxy/healthcheck.http

# Copy scripts
COPY reload-haproxy.sh /
RUN chmod a+x /reload-haproxy.sh
COPY generate-haproxy.sh /
RUN chmod a+x /generate-haproxy.sh

# Add cron task to reload HAProxy config
RUN echo "* * * * * /bin/bash /reload-haproxy.sh > /proc/1/fd/1 2>/proc/1/fd/2\n" >> /etc/cron.d/reload-haproxy-cron
RUN crontab /etc/cron.d/reload-haproxy-cron

# Start HAProxy
CMD ["haproxy", "-f", "/usr/local/etc/haproxy/haproxy.cfg"]