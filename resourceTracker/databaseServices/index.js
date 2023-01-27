const dynamodb=require('./dynamodbTagging')
exports.handler=async(event)=>{
await dynamodb.handler(event)
}