FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN chmod +x entrypoint.sh

EXPOSE 8788

ENTRYPOINT ["./entrypoint.sh"]
