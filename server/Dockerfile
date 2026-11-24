# Skull King leaderboard API — build from the repo root:
#   docker compose -f server/compose.yaml up -d --build
FROM node:26-slim
WORKDIR /app
ENV NODE_ENV=production
# Node runs the TypeScript sources directly (type stripping): no build step.
RUN echo '{"type":"module"}' > package.json
COPY src/games/skull-king/game/scoring.ts src/games/skull-king/game/scoring.ts
COPY server/index.ts server/db.ts server/validate.ts server/
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server/index.ts"]
