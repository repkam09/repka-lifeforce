# Pull the latest changes from the repository
git pull

# Build the docker image
docker build -t repka-lifeforce .

# Stop and remove the current container
docker compose down

# Create backup directory if it doesn't exist
mkdir -p ./data/bak

# Get the current timestamp
timestamp=$(date +"%Y%m%d%H%M%S")

# Create a backup of the SQLite database
cp ./data/lifeforce.sqlite ./data/bak/lifeforce_${timestamp}.sqlite

# Start the new container
docker compose up -d
