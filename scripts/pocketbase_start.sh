#!/bin/bash

# Check if container is already running
if podman ps --format "{{.Names}}" | grep -q "^pocketbase$"; then
    echo "Pocketbase container is already running"
    exit 0
fi

# Start the container if it's not running
podman run -d --rm \
  -p 8090:8080 \
  -v ./pb_data:/pb/pb_data:Z \
  --name pocketbase \
  pocketbase