cd /code 
python manage.py migrate > /dev/null 2&>1
python manage.py createsuperuser