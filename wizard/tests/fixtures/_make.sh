#!/bin/sh
set -e
ROOT="$(dirname "$0")/fake-project"
rm -rf "$ROOT"
mkdir -p "$ROOT"/{.git,BACKEND/src,BACKEND/dist,BACKEND/node_modules/.bin,FRONTENDV2/src,FRONTENDV2/build,FRONTENDV2/node_modules/.bin}
touch "$ROOT/compose.yaml" "$ROOT/BACKEND/Dockerfile" "$ROOT/FRONTENDV2/Dockerfile"
printf '{}' > "$ROOT/BACKEND/package.json"
printf '{}' > "$ROOT/FRONTENDV2/package.json"
printf '{}' > "$ROOT/BACKEND/tsconfig.json"
printf '{}' > "$ROOT/FRONTENDV2/tsconfig.json"
: > "$ROOT/BACKEND/src/index.ts"
: > "$ROOT/FRONTENDV2/src/index.tsx"
printf 'console.log("ok")' > "$ROOT/BACKEND/dist/index.js"
printf '<html></html>' > "$ROOT/FRONTENDV2/build/index.html"
touch "$ROOT/BACKEND/node_modules/.bin/tsc" "$ROOT/FRONTENDV2/node_modules/.bin/vite"
printf 'PORT=3220\nMONGO_URI=mongodb://localhost:27017/visioconf\n' > "$ROOT/BACKEND/.env.template"
printf 'REACT_APP_BACKEND_URL=http://localhost:3220\n' > "$ROOT/FRONTENDV2/.env.template"
