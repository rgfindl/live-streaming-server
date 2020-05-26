const _ = require('lodash');
const axios = require('axios');
const AWS = require('aws-sdk');
const logger = require('./logger');

const ecs = new AWS.ECS();
const ec2 = new AWS.EC2();

const cluster = 'video-streaming';
const containerPort = 8000;

const fetchServer = async (taskARN) => {
  //logger.log('fetchServers');
  const tasks = [ taskARN ];

  // Describe the tasks.
  const describeTasksResult = await ecs.describeTasks({ cluster, tasks }).promise();
  //logger.log(JSON.stringify(describeTasksResult, null, 3));
  const containerInstanceArns = _.reduce(describeTasksResult.tasks, (result, value, key) => {
    if (!_.includes(result, value.containerInstanceArn)) {
      result.push(value.containerInstanceArn);
    }
    return result;
  }, []);

  // Describe the container instance 
  const describeContainerInstancesResult = await ecs.describeContainerInstances({ cluster, containerInstances: containerInstanceArns }).promise();
  //logger.log(JSON.stringify(describeContainerInstancesResult, null, 3));

  const containerInstances = _.map(describeContainerInstancesResult.containerInstances, (item) => ({
    containerInstanceArn: item.containerInstanceArn,
    ec2InstanceId: item.ec2InstanceId
  }));
  //logger.log(JSON.stringify(containerInstances, null, 3));

  const describeInstancesResult = await ec2.describeInstances({ InstanceIds: _.map(containerInstances, 'ec2InstanceId') }).promise();
  //logger.log(JSON.stringify(describeInstancesResult, null, 3));

  const servers = _.map(describeTasksResult.tasks, (task) => {
    const { containerInstanceArn } = task;
    const ec2InstanceId = _.find(containerInstances, { containerInstanceArn }).ec2InstanceId;
    const ip = _.find(describeInstancesResult.Reservations[0].Instances, { InstanceId: ec2InstanceId }).PrivateIpAddress;
    const port = _.find(task.containers[0].networkBindings, { containerPort }).hostPort;
    return `${ip}:${port}`;
  });
  //logger.log(JSON.stringify(servers, null, 3));

  return _.first(servers);
};

const fetchTaskMetadata = async () => {
  const taskMetadataResponse = await axios.get(`${process.env.ECS_CONTAINER_METADATA_URI}/task`);
  return taskMetadataResponse.data;
};

const getServer = async () => {
  const { TaskARN } = await fetchTaskMetadata();
  return await fetchServer(TaskARN);
};

module.exports = {
  fetchServer,
  fetchTaskMetadata,
  getServer
};