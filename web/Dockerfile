# 서버에 Node 가 없어도 되도록 이미지 안에서 빌드한다. 결과물(정적 파일)만 nginx 에 싣는다.
FROM node:24-alpine AS build
WORKDIR /web
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine

# Vite base(/interview/)와 같은 경로 아래에 파일을 둔다. 게이트웨이가 /interview/ 를 그대로 전달한다.
COPY --from=build /web/dist /usr/share/nginx/html/interview
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/interview/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
