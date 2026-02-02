FROM ghcr.io/muchobien/pocketbase:latest

COPY pb_schema.json /init/pb_schema.json

CMD ["pocketbase", "serve", "--http=0.0.0.0:8090"]