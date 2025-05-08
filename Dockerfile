FROM alpine:3.19

ARG PB_VERSION=0.25.8 
ENV POCKETBASE_DIR="/pb"
ENV PB_DATA_DIR="${POCKETBASE_DIR}/pb_data"

RUN apk add --no-cache \
    unzip \
    ca-certificates \
    curl \
    && addgroup -S appgroup && adduser -S appuser -G appgroup

ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d ${POCKETBASE_DIR}/ && \
    rm /tmp/pb.zip && \
    mkdir -p ${PB_DATA_DIR} && \
    chown -R appuser:appgroup ${POCKETBASE_DIR}

USER appuser
WORKDIR ${POCKETBASE_DIR}

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["./pocketbase", "serve", "--http=0.0.0.0:8080", "--dir=${PB_DATA_DIR}"]
