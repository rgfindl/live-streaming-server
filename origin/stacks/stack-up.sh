#!/bin/bash

PROFILE="--profile bluefin"

case $1 in
    ecr)
        aws cloudformation deploy \
        --template-file ecr.stack.yml \
        --stack-name video-streaming-origin-ecr \
        --capabilities CAPABILITY_IAM \
        --parameter-overrides \
        RepositoryName=video-streaming-origin \
        ${PROFILE}
        ;;
    service)
        aws cloudformation deploy \
        --template-file service.stack.yml \
        --stack-name video-streaming-origin \
        --capabilities CAPABILITY_NAMED_IAM \
        --parameter-overrides \
        Version=1.0.3 \
        DesiredCount=0 \
        Domain=live.finbits.io \
        ${PROFILE}
        ;;
    *)
        echo $"Usage: $0 {ecr|service-}"
        exit 1
esac