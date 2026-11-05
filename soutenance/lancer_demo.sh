#!/bin/zsh
# Lance tout l'environnement de démo Kilani HR (à exécuter 15 min avant la soutenance)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "1/4 Démarrage de Docker..."
open -a Docker
until docker info >/dev/null 2>&1; do sleep 2; done

echo "2/4 Démarrage de SQL Server (conteneur sqlserver)..."
docker start sqlserver >/dev/null
sleep 15

echo "3/4 Démarrage du serveur API (port 5050) et du back-office (port 5173)..."
(cd "$ROOT/backend" && node server.js > /tmp/kilani_backend.log 2>&1 &)
(cd "$ROOT/backoffice" && npx vite --port 5173 > /tmp/kilani_backoffice.log 2>&1 &)
sleep 6
curl -s -o /dev/null -w "   API : %{http_code}\n" -X POST localhost:5050/api/auth/login \
  -H 'Content-Type: application/json' -d '{"identifier":"EMP001","password":"password123"}'
open http://localhost:5173

echo "4/4 Lancement de l'application mobile sur le simulateur iPhone..."
open -a Simulator
xcrun simctl boot "iPhone 17 Pro" 2>/dev/null
cd "$ROOT/mobile" && flutter run -d "iPhone 17 Pro"
