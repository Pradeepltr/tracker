const AWS=require('aws-sdk')
const DB = new AWS.DynamoDB.DocumentClient();
exports.DbHandlePut = async (userName,userType,created_at,region,resourceInfo,arn) => {
    
    let validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
    let flag
    if(userName.match(validRegex))
    {
        flag=true
    }else{
        flag=false
    }const params = {
        'TableName': 'AWSResourceTracker',
        'Key': {
            userName: userName,
            userType: userType
        }
    }
    try{
    let data_info = await DB.get(params).promise()
    console.log(data_info)
    let tag = JSON.stringify(data_info)
    if (tag == '{}') {
        console.log('Conditon Checked')
        const userInfo = {
            TableName: 'AWSResourceTracker',
            Item: {
                userName: userName,
                userType: userType,
                Arn: arn,
                isEmail:flag,
                resources: [
                    {
                        resourceInfo: resourceInfo,
                        createdAt: created_at,
                        region: region

                    }
                ]
                

            }
        }
        await DB.put(userInfo).promise()
        
    } else {
        const param = {
            'TableName': 'AWSResourceTracker',
            'Key': {
                userName: userName,
                userType: userType
            },
            "UpdateExpression": "SET #attrName = list_append(#attrName, :attrValue)",
            "ExpressionAttributeNames": {
                "#attrName": "resources"
            },
            "ExpressionAttributeValues": {
                ":attrValue": [
                    {
                        resourceInfo: resourceInfo,
                        createdAt: created_at,
                        region: region
                    }
                ]

            }
        }
        await DB.update(param).promise()

    }
}catch(err)
{
    console.log(err)
}

};