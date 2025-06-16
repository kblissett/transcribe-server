.DUMMY: up

up:
	uv run manage.py migrate
	uv run manage.py runserver
