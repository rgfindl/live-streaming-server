#!/bin/bash

PROFILE="--profile bluefin"

case $1 in
    vpc)
        aws cloudformation deploy \
        --template-file vpc.stack.yml \
        --stack-name video-streaming-vpc \
        --capabilities CAPABILITY_IAM \
        --parameter-overrides \
        KeyPairName=video-streaming \
        ${PROFILE}
        ;;
    assets)
        aws cloudformation deploy \
        --template-file assets.stack.yml \
        --stack-name video-streaming-assets \
        --capabilities CAPABILITY_IAM \
        ${PROFILE}
        ;;
    ecs)
        aws cloudformation deploy \
        --template-file ecs.stack.yml \
        --stack-name video-streaming-ecs \
        --capabilities CAPABILITY_IAM \
        --parameter-overrides \
        Name=video-streaming \
        ${PROFILE}
        ;;
    *)
        echo $"Usage: $0 {vpc|assets|ecs}"
        exit 1
esac