const AWS = require('aws-sdk');

const s3 = initializeS3Client();
const BUCKET_NAME = process.env.S3_BUCKET;

async function listS3Objects() {
    try {
        const { Contents } = await s3.listObjectsV2({ Bucket: BUCKET_NAME }).promise();
        return Contents || [];
    } catch (error) {
        handleError("Erreur lors de la récupération des fichiers S3", error);
    }
}

function getSignedUrl(key) {
    try {
        return s3.getSignedUrl('getObject', {
            Bucket: BUCKET_NAME,
            Key: key,
            Expires: 3600,
        });
    } catch (error) {
        handleError("Erreur lors de la génération de l'URL signée", error);
    }
}

function initializeS3Client() {
    return new AWS.S3({
        endpoint: process.env.S3_ENDPOINT,
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
        region: process.env.S3_REGION,
        signatureVersion: 'v4',
    });
}

function handleError(message, error) {
    console.error(`${message} :`, error);
    throw error;
}

module.exports = {
    listS3Objects,
    getSignedUrl,
};