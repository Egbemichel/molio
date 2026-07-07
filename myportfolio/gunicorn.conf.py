# Gunicorn configuration — auto-loaded when the server runs
# `gunicorn config.wsgi:application` from this directory (Render's start command).
#
# The important line is `timeout`: uploading several images through the admin
# sends each one to Cloudinary sequentially. On a small free instance that can
# take well over gunicorn's 30s default, at which point the worker is killed and
# the request "fails spectacularly". A generous timeout lets the uploads finish.
#
# gthread (threaded) workers keep memory low while still handling the slow,
# I/O-bound Cloudinary calls concurrently.

timeout = 120
graceful_timeout = 120
worker_class = "gthread"
workers = 1
threads = 8
max_requests = 400
max_requests_jitter = 40
