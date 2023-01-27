const AWS=require('aws-sdk')
const S3=new AWS.S3();
const DB=new AWS.DynamoDB.DocumentClient()
const DBPut=require('./utils/DbHandlePut')
const DBDel=require('./utils/DbHandleDelete')
exports.handler = async (event) => {
    let data = event.detail
    let eventName = data.eventName
    let ARNInfo = data.userIdentity.arn
    let user = ARNInfo.split('/')
    let userName = user[user.length - 1]
    let userType=data.userIdentity.type
    if (eventName.includes('CreateBucket')) {
        const tagCheck = {
            Bucket: data.requestParameters.bucketName
        }
        try{
        await S3.getBucketTagging(tagCheck).promise()
        console.log('Tag already added')
        }
        catch(err) {
            let bucketName=data.requestParameters.bucketName
            let eventTime=data.eventTime
            let region=data.awsRegion
            let resourceInfo={
                resourceId:bucketName,
                resourceName:`Bucket Name : ${bucketName}`,
                resourceType: event.detail.eventSource
            }
            await DBPut.DbHandlePut(userName,userType,eventTime,region,resourceInfo,ARNInfo)
            console.log('Added Resource data to dynamodb')   
            const setTagsParam = {
                    Bucket: data.requestParameters.bucketName,
                    Tagging:{
                    'TagSet': [
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
                }
                await S3.putBucketTagging(setTagsParam).promise()
                console.log('tags Added')

            }
    } else if (eventName.includes('DeleteBucket')) {
        try{
            const param = {
                'TableName': 'AWSResourceTracker',
                'Key': {
               userName: userName,
               userType: userType
                 }
              }
            let eventResourceId=data.requestParameters.bucketName
            let index = -1
            let list = await DB.get(param).promise()
            let userResourceList = list.Item.resources
            console.log(userResourceList)
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
        console.log('Resource deleted from DynamoDB')
    }catch(err)
    {
        console.log(err)
    }
    }

};