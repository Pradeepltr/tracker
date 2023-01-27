const ApiGateway=require('./ApiGatewayTagging')
exports.handler=async(event)=>{
await ApiGateway.handler(event)
}