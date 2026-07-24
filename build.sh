#!/usr/bin/env bash
# Render.com build script for Django

set -o errexit  # exit on error

pip install -r requirements.txt

python manage.py collectstatic --no-input
python manage.py migrate
