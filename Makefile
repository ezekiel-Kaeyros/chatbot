start_db:
	docker-compose up -d --build --force-recreate --renew-anon-volumes

stop_db:
	docker compose down

server:
	yarn run dev
deploy:
	yarn run deploy

logs:
	docker-compose logs -f --tail=50 $(n)

prune:
	docker system prune -a --volumes

.PHONEY: start_db stop_db server logs prune