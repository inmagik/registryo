cd /code
python manage.py collectstatic --noinput
python manage.py migrate
trap 'kill %1' SIGINT
uvicorn docker_registry_ui.asgi:application --workers=4 --proxy-headers --host=0.0.0.0 --port=8000 & nginx -g "daemon off;"
trap - SIGINT