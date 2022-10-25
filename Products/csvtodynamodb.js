const AWS = require("aws-sdk");
const s3 = new AWS.S3();

// bucket name env var will be set in serverless.yml file
const BUCKET_NAME = 'onlinestoreimages';
const TABLE_NAME ='students';
module.exports.csvtodynamodb = async event => {
    console.log(event);
    const response = {
        isBase64Encoded: false,
        statusCode: 200,
    };

        bucket_name = event['Records'][0]['s3']['bucket']['name']
        s3_file_name = event['Records'][0]['s3']['object']['key']
        resp = s3_client.get_object(Bucket=bucket_name,Key=s3_file_name)
        data = resp['Body'].read().decode('utf-8') 
        Students = data.split("\n")
        console.log(Students);
        for (const type of Students) {  
            console.log(`A JavaScript type is: ${type}`);
            stud_data = type.split(",");
            table.put_item(
                Item = {
                    "id"        : stud_data[0],
                    "name"      : stud_data[1],
                    "address"   : stud_data[2]
                }
            )
          }
    
 };




