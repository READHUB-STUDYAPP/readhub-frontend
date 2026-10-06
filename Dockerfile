# ReadHub Frontend — multi-stage: Vite build -> static served by nginx
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_* vars are baked in at build time. Pass them as build args.
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# --- Runtime: nginx serving the SPA ---
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/frontend.conf /etc/nginx/conf.d/default.conf

# Drop root, while still listening on :80 (Trivy DS-0002).
#
# The usual way to run nginx unprivileged is to move it to :8080, because a
# non-root process cannot bind a port below 1024. That is not free here:
# Traefik routes to port 80 by a label in the infra repo
# (traefik.http.services.readhub-frontend.loadbalancer.server.port=80), so
# changing the port here alone would break staging and production the moment
# this merged.
#
# Granting the binary CAP_NET_BIND_SERVICE keeps the published port exactly as
# it is while the server itself runs as the unprivileged `nginx` user that the
# image already ships. libcap is removed again in the same layer so setcap
# does not remain available inside the running image.
#
# The chowns cover every path nginx writes to; without them it exits at
# startup unable to open its own pid file. The `user` directive is dropped
# because nginx warns and ignores it when the master is already unprivileged.
# The published base image lags Alpine's own patched packages, which is where
# every one of its 44 critical/high findings came from -- musl, libssl3,
# libxml2, zlib and friends, all with fixes already released. Upgrading them at
# build time takes the image to zero. Without this the image is only as fresh
# as the last time upstream happened to rebuild it.
RUN apk upgrade --no-cache \
 && apk add --no-cache libcap \
 && setcap cap_net_bind_service=+ep /usr/sbin/nginx \
 && touch /var/run/nginx.pid \
 && chown -R nginx:nginx /var/cache/nginx /var/log/nginx /var/run/nginx.pid /usr/share/nginx/html \
 && sed -i '/^user /d' /etc/nginx/nginx.conf \
 && apk del libcap

USER nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
