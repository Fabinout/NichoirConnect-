const AWS = require('aws-sdk');

const s3Clients = {
    2025: initializeS3Client('2025'),
    2026: initializeS3Client('2026'),
};

const buckets = {
    2025: process.env.S3_BUCKET_2025,
    2026: process.env.S3_BUCKET_2026,
};

async function listS3Objects(year) {
    const s3 = s3Clients[year];
    const bucket = buckets[year];
    try {
        const { Contents } = await s3.listObjectsV2({ Bucket: bucket }).promise();
        return Contents || [];
    } catch (error) {
        handleError(`Erreur lors de la récupération des fichiers S3 (${year})`, error);
    }
}

function getSignedUrl(year, key) {
    const s3 = s3Clients[year];
    const bucket = buckets[year];
    try {
        return s3.getSignedUrl('getObject', {
            Bucket: bucket,
            Key: key,
            Expires: 3600,
        });
    } catch (error) {
        handleError(`Erreur lors de la génération de l'URL signée (${year})`, error);
    }
}

function initializeS3Client(year) {
    return new AWS.S3({
        endpoint: process.env[`S3_ENDPOINT_${year}`],
        accessKeyId: process.env[`S3_ACCESS_KEY_${year}`],
        secretAccessKey: process.env[`S3_SECRET_KEY_${year}`],
        region: process.env[`S3_REGION_${year}`],
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
