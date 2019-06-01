#!/bin/bash

PROFILE="--profile wp-sandbox"

case $1 in
    vpc)
        aws cloudformation deploy \
        --template-file vpc.stack.yml \
        --stack-name video-streaming-vpc \
        --capabilities CAPABILITY_IAM \
        ${PROFILE}
        ;;
    shared)
        aws cloudformation deploy \
        --template-file shared.stack.yml \
        --stack-name video-streaming-shared \
        --capabilities CAPABILITY_IAM \
        ${PROFILE}
        ;;
    ecs)
        aws cloudformation deploy \
        --template-file ecs.stack.yml \
        --stack-name video-streaming-ecs \
        --capabilities CAPABILITY_IAM \
        ${PROFILE}
        ;;
    ecr)
        aws cloudformation deploy \
        --template-file ecr.stack.yml \
        --stack-name video-streaming-ecr \
        --capabilities CAPABILITY_IAM \
        ${PROFILE}
        ;;
    service)
        aws cloudformation deploy \
        --template-file service.stack.yml \
        --stack-name video-streaming-service \
        --capabilities CAPABILITY_IAM \
        ${PROFILE}
        ;;
    *)
        echo $"Usage: $0 {vpc|shared|ecs|ecr|service}"
        exit 1
esac