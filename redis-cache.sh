docker stop lifeforce-cache
docker rm lifeforce-cache
docker run --name lifeforce-cache -p 6379:6379 -d redis