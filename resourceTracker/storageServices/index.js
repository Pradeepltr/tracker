const S3=require('./S3Tagging')
exports.handler=async(event)=>{
    await S3.handler(event)
}