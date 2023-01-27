const AWS=require('aws-sdk')
const DB=new AWS.DynamoDB.DocumentClient()
const API = new AWS.APIGateway()
const DBPut=require('./utils/DbHandlePut')
const DBDel=require('./utils/DbHandleDelete')
exports.handler = async (event) => {
    try{
    let data = event.detail
    let eventName = data.eventName
    let ARNInfo = data.userIdentity.arn
    let user = ARNInfo.split('/')
    let userName = user[user.length - 1]
    let userType=data.userIdentity.type
    if (eventName.includes('CreateRestApi') || eventName.includes('ImportRestApi')) {
        let region = event.region
        let ApiId = data.responseElements.id
        let eventTime=data.eventTime
        let ApiName=data.responseElements.name
        let ApiArn = 'arn:aws:apigateway:' + region + '::/restapis/' + ApiId
        const tagCheckParam = {
            resourceArn: ApiArn
        }
        let tagInfo = await API.getTags(tagCheckParam).promise()
        let tags = JSON.stringify(tagInfo.tags)
        if (tags == '{}') {
            let resourceInfo={
                resourceId:ApiId,
                resourceName:`Api Name : ${ApiName}` ,
                resourceType: event.detail.eventSource,
            }
            await DBPut.DbHandlePut(userName,userType,eventTime,region,resourceInfo,ARNInfo)
           console.log('Added Resource data to dynamodb')
            const setTagsParam = {
                resourceArn: ApiArn,
                tags: {
                    createdBy: userName,
                    createdAt: event.time,
                    userType: data.userIdentity.type
                }
            }
            await API.tagResource(setTagsParam).promise()
            console.log('Tags Added')
        }

    } else if (eventName.includes('DeleteRestApi')) {
            const param = {
                'TableName': 'AWSResourceTracker',
                'Key': {
               userName: userName,
               userType: userType
                 }
              }
            let eventResourceId=data.requestParameters.restApiId
            let index = -1
            let list = await DB.get(param).promise()
            let userResourceList = list.Item.resources
            console.log({userResourceList})
        
            let DbResourceId
            for (let i = 0; i < userResourceList.length; i++) {
              
                let element = userResourceList[i]
                DbResourceId=element.resourceInfo.resourceId
                if (DbResourceId == eventResourceId) {
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