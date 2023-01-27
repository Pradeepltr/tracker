const AWS=require('aws-sdk')
const DB=new AWS.DynamoDB.DocumentClient()
const DBTagging = new AWS.DynamoDB()
const DBPut=require('./utils/DbHandlePut')
const DBDel=require('./utils/DbHandleDelete')
exports.handler= async (event) => {
    try{
    let data = event.detail
    let eventName = data.eventName
    let ARNInfo = data.userIdentity.arn
    let user = ARNInfo.split('/')
    let userName = user[user.length - 1]
    let userType=data.userIdentity.type
    if (eventName.includes('CreateTable')) {
        let arn = data.responseElements.tableDescription
        const tagCheckParam = {
            ResourceArn: arn.tableArn
        }
        
        let tagInfo = await DBTagging.listTagsOfResource(tagCheckParam).promise()
        let tags = tagInfo.Tags
        let eventTime=data.eventTime
        let region=data.awsRegion
        let tableName=data.requestParameters.tableName
        if (tags.length == 0) {
            let resourceInfo={
                resourceId:tableName,
                resourceName: `Table Name : ${tableName}`,
                resourceType: event.detail.eventSource,
            }
            await DBPut.DbHandlePut(userName,userType,eventTime,region,resourceInfo,ARNInfo)
            console.log('Added Resource data to dynamodb')
            const setTagsParam = {
                ResourceArn: arn.tableArn,
                'Tags': [
                    {
                        'Key': 'createdBy',
                        'Value': userName
                    },
                    {
                        'Key': 'createdAt',
                        'Value': data.eventTime
                    },
                    {
                        'Key': 'userType',
                        'Value': data.userIdentity.type
                    }
                ]
            }
            await DBTagging.tagResource(setTagsParam).promise()
            console.log('Tags Added')
        }

    } else if (eventName.includes('DeleteTable')) {
            const param = {
                'TableName': 'AWSResourceTracker',
                'Key': {
               userName: userName,
               userType: userType
                 }
              }
            let eventResourceId=data.requestParameters.tableName
            let index = -1
            let list = await DB.get(param).promise()
            let userResourceList = list.Item.resources
            console.log({userResourceList})
        
            let DbResourceId
            for (let i = 0; i < userResourceList.length; i++) {
              
                let element = userResourceList[i]
                DbResourceId=element.resourceInfo.resourceId
                if (DbResourceId == eventResourceId) {
                    console.log("True")
                    index = i
                    break
                }
            }
        await DBDel.DbHandleDelete(index,userName,userType)
        console.log('Resource deleted from DynamoDb')
    }
}catch(err)
{
    console.log(err)
}
};