import multiprocessing
import os

# Gunicorn config
bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
keepalive = 5
errorlog = "/var/log/emisify/error.log"
accesslog = "/var/log/emisify/access.log"
loglevel = "info"

# SSL Configuration (uncomment and configure when SSL is ready)
# keyfile = "/etc/letsencrypt/live/emisify.com/privkey.pem"
# certfile = "/etc/letsencrypt/live/emisify.com/fullchain.pem"

# Process naming
proc_name = "emisify_api"

# Server mechanics
daemon = False
pidfile = "/var/run/emisify/gunicorn.pid"
user = "emisify"
group = "emisify"

# Server hooks
def on_starting(server):
    """
    Log when the server starts
    """
    server.log.info("Starting Emisify API server")

def on_exit(server):
    """
    Log when the server exits
    """
    server.log.info("Stopping Emisify API server") 