#!/bin/sh
# Script to seed all databases after containers are up
# Run with: docker-compose -f docker-compose.microservices.yml exec -T db-auth psql...

set -e

echo "========================================="
echo "  Seeding databases..."
echo "========================================="

# Wait for databases to be ready
sleep 5

echo "[1/3] Seeding Auth database..."
docker-compose -f docker-compose.microservices.yml exec -T db-auth psql -U postgres -d lava_auto_auth -f /docker-entrypoint-initdb.d/seed.sql 2>/dev/null || echo "Auth seed already applied or failed"

echo "[2/3] Seeding Vehicle database..."
docker-compose -f docker-compose.microservices.yml exec -T db-vehicles psql -U postgres -d lava_auto_vehicles -f /docker-entrypoint-initdb.d/seed.sql 2>/dev/null || echo "Vehicle seed already applied or failed"

echo "[3/3] Reservation database seeds are in schema.sql"

echo ""
echo "========================================="
echo "  ✓ Seeding complete!"
echo "========================================="
echo ""
echo "Test users:"
echo "  Admin:   admin@lavauto.com / admin123"
echo "  Cliente: cliente@test.com / client123" 
echo "  Lavador: lavador@test.com / washer123"
