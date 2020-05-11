FROM haproxy:2.1

# Install deps
RUN apt-get update && \
    apt-get install -y --no-install-recommends python-pip curl unzip cron && \
    pip install jinja2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
RUN unzip awscliv2.zip
RUN ./aws/install

# Add HAProxy template
ADD generate-haproxy.py /generate-haproxy.py
RUN chmod +x /generate-haproxy.py

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
RUN echo "* * * * * /bin/bash /reload-haproxy.sh >>/var/log/cron.log 2>&1\n" >> /etc/cron.d/reload-haproxy-cron
RUN crontab /etc/cron.d/reload-haproxy-cron

# Start HAProxy
CMD ["haproxy", "-f", "/usr/local/etc/haproxy/haproxy.cfg"]