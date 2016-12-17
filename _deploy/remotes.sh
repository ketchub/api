#!/usr/bin/env bash

OUTPUT_STOP=$(docker stop $(docker ps -q) 2>&1)
if [[ $? == 0 ]]; then echo $OUTPUT_STOP; else echo 'No containers to stop...'; fi

OUTPUT_REMOVE=$(docker rm $(docker ps -a -q) 2>&1)
if [[ $? == 0 ]]; then echo $OUTPUT_REMOVE; else echo 'No containers to remove...'; fi

OUTPUT_REMOVE_IMAGES=$(docker rmi $(docker images -q) 2>&1)
if [[ $? == 0 ]]; then echo $OUTPUT_REMOVE_IMAGES; else echo 'No images to remove...'; fi

cd /tmp
docker load < api-image.tar
docker run -d -p 3000:3000 --net=host ketch/api

echo "New image deployed and running..."
