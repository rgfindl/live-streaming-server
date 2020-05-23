const _ = require('lodash');
const ejs = require('ejs');
const fs = require('fs');
const AWS = require('aws-sdk');
const ecs = new AWS.ECS();
const ec2 = new AWS.EC2();

const cluster = 'video-streaming';
const serviceName = 'video-streaming-server';
const containerPort = 8000;

const fetchServers = async () => {
  //console.log('fetchServers');
  try {
    // Get the ECS Service tasks
    const listTasksResult = await ecs.listTasks({ cluster, serviceName }).promise();
    //console.log(JSON.stringify(listTasksResult, null, 3));
    const { taskArns: tasks } = listTasksResult;

    // Describe the tasks.
    const describeTasksResult = await ecs.describeTasks({ cluster, tasks }).promise();
    //console.log(JSON.stringify(describeTasksResult, null, 3));
    const containerInstanceArns = _.reduce(describeTasksResult.tasks, (result, value, key) => {
      if (!_.includes(result, value.containerInstanceArn)) {
        result.push(value.containerInstanceArn);
      }
      return result;
    }, []);

    // Describe the container instance 
    const describeContainerInstancesResult = await ecs.describeContainerInstances({ cluster, containerInstances: containerInstanceArns }).promise();
    //console.log(JSON.stringify(describeContainerInstancesResult, null, 3));

    const containerInstances = _.map(describeContainerInstancesResult.containerInstances, (item) => ({
      containerInstanceArn: item.containerInstanceArn,
      ec2InstanceId: item.ec2InstanceId
    }));
    //console.log(JSON.stringify(containerInstances, null, 3));

    const describeInstancesResult = await ec2.describeInstances({ InstanceIds: _.map(containerInstances, 'ec2InstanceId') }).promise();
    //console.log(JSON.stringify(describeInstancesResult, null, 3));

    const servers = _.map(describeTasksResult.tasks, (task) => {
      const { containerInstanceArn } = task;
      const ec2InstanceId = _.find(containerInstances, { containerInstanceArn }).ec2InstanceId;
      const ip = _.find(describeInstancesResult.Reservations[0].Instances, { InstanceId: ec2InstanceId }).PrivateIpAddress;
      const port = _.find(task.containers[0].networkBindings, { containerPort }).hostPort;
      return `${ip}:${port}`;
    });
    //console.log(JSON.stringify(servers, null, 3));

    return servers;
  } catch (err) {
    console.log(err);
    return [];
  }
};

const generateTemplate = async () => {
  //console.log('generateTemplate');
  const servers = await fetchServers();
  //console.log(JSON.stringify(process.argv));
  const templateFile = process.argv[2];
  const outputFile = process.argv[3];
  const template = fs.readFileSync(templateFile, 'utf8');
  //console.log(template);
  const output = ejs.render(template, { servers }, {});
  fs.writeFileSync(outputFile, output);
};

generateTemplate();