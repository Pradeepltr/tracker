const AWS=require('aws-sdk')
const DB=new AWS.DynamoDB.DocumentClient()
const DBPut=require('./utils/DbHandlePut')
const DBDel=require('./utils/DbHandleDelete')
const lambda = new AWS.Lambda();
exports.handler = async (event) => {
    try{
        let data = event.detail
        let eventName = data.eventName
        let userType = data.userIdentity.type
        let created_at = data.eventTime
        let ARNInfo = data.userIdentity.arn
        let user = ARNInfo.split('/')
        let userName = user[user.length - 1]
    if (eventName.includes('CreateFunction')) {
        let FunctionARN = data.responseElements.functionArn
        let region=data.awsRegion
        const tagCheckParam = {
            Resource: FunctionARN
        }
        
        let tag_info = await lambda.listTags(tagCheckParam).promise()
        const val = JSON.stringify(tag_info.Tags)
        console.log(val)
        if (val == '{}') {
            let functionName=data.requestParameters.functionName
            let resourceInfo={
                resourceId: functionName,
                resourceName: `Function Name : ${functionName}`,
                resourceType: event.detail.eventSource,
                
            }
            await DBPut.DbHandlePut(userName,userType,created_at,region,resourceInfo,ARNInfo)
            console.log('Added Resource data to dynamodb')
            const setTagsParam = {
                Resource: FunctionARN,
                'Tags': {
                    createdBy: userName,
                    createdAt: created_at,
                    userType: userType
                }
            }
            await lambda.tagResource(setTagsParam).promise()
            console.log('Tags Added')
         }
        } else if (eventName.includes('DeleteFunction')) {
            const param = {
                'TableName': 'AWSResourceTracker',
                'Key': {
               userName: userName,
               userType: userType
                 }
              }
            let eventResourceId=data.requestParameters.functionName
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
        console.log('Resource delete from DynamoDb')
}
    }catch(err)
    {
        console.log(err)
    }
};