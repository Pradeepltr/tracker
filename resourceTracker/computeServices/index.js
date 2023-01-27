const lambda=require('./lambdaTagging')
exports.handler= async(event)=>{
    await lambda.handler(event)
}