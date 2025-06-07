const express = require('express');
const ObjectID = require('mongodb').ObjectID;
const aws = require('aws-sdk');
const mongoose = require('mongoose');
const path = require('path')
const Image = require('../models/image.model');

if (!process.env.ACCESS_KEY) {
    throw new Error('ACCESS_KEY IS MISSING FROM ENV')
}

if (!process.env.SECRET_ACCESS_KEY) {
    throw new Error('SECRET_ACCESS_KEY IS MISSING FROM ENV')
}

if (!process.env.REGION) {
    throw new Error('AWS_REGION IS MISSING FROM ENV')
}
if (!process.env.BUCKET) {
    throw new Error('AWS_BUCKET IS MISSING FROM ENV')
}

function randName() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

function niceBytes(x) {

    let l = 0,
        n = parseInt(x, 10) || 0;

    while (n >= 1024 && ++l) {
        n = n / 1024;
    }
    return (n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]);
}



aws.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new aws.S3();

async function uploadFile(key, file) {
    const params = {
        Bucket: process.env.BUCKET,
        Key: key,
        Body: file.buffer || file,
        ACL: 'public-read',
        ContentType: file.mimetype,
        CacheControl: 'public, max-age=86400'
    };
    try {
        return await s3.upload(params).promise();
    } catch (error) {
        console.log("Uploading Files ..", error);
        return null;
    }
}

async function uploadMediaFiles(file) {
    try {
        console.log("-----------------", file)
        const key = `${process.env.BUCKET}/${randName()}_${file.originalname}`;
        const stored = await uploadFile(key, file);

        let cloudFrontUrl = stored.Location.replace(`${process.env.BUCKET}.s3.amazonaws.com`, `${process.env.CDN_URL}`)

        var newImage = new Image();
        newImage.name = file.originalname;
        newImage.size = niceBytes(file.size);
        newImage.type = file.mimetype;
        newImage.encoding = file.encoding;
        newImage.path = cloudFrontUrl;
        // newImage.path = key;

        let doc = await newImage.save()
        return doc;
    } catch (error) {
        console.log(error)
        throw error;

    }
}
async function uploadMediaMultipleFiles(files) {
    if (!Array.isArray(files)) {
        throw new Error('Input must be an array of files');
    }
    const results = [];
    for (const file of files) {
        try {
            const doc = await uploadMediaFiles(file);
            results.push(doc);
        } catch (error) {
            results.push({ error: error.message, file: file.originalname });
        }
    }
    return results;
}

async function deleteFileFromS3(key, imageId) {
    const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: key,
    };
    try {
        await Image.findByIdAndDelete({ _id: imageId })
        return await s3.deleteObject(params).promise();
    } catch (error) {
        console.error(error);
        return null;
    }
}



async function downloadFileFromS3(key) {
    const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: key,
    };
    try {
        let res = await s3.getObject(params).promise();
        return res;
    } catch (error) {
        console.error(error);
        return null;
    }
}


async function getImageUrl(imageId) {
    try {
        let image = await Image.findOne({
            _id: imageId
        })
        if (image) {
            let url = image.path;
            // if (!image.path.includes('cloudfront.net')) {
            url = `${process.env.CDN_URL}/${image.path}`;
            // }
            return url;
        } else {
            return null;
        }

    } catch (error) {
        console.error(error);
        return null;
    }
}


async function getImage(imageId) {

    try {
        let image = await Image.findOne({
            _id: imageId
        })
        if (image) {
            /*  if (image.path.includes('cloudfront.net')) {
               let newPath = path.basename(image.path);
               image.path = newPath;

             } */

            return image;
        } else {
            return null;
        }

    } catch (error) {
        console.error(error);
        return null;
    }
}


const imageUpload = async (base64) => {
    // let objectId = new ObjectID("000000000000");
    let objectId = mongoose.Types.ObjectId("000000000000")
    // console.log(objectId )

    const base64Data = new Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ""), 'base64');

    // Getting the file type, ie: jpeg, png or gif
    // const type = base64.split(';')[0].split('/')[1];
    const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: process.env.AWS_BUCKET_FOLDER + '/default.jpeg', // type is not required
        Body: base64Data,
        ACL: 'public-read',
        ContentEncoding: 'base64', // required
        ContentType: 'image/jpeg'
    }
    let location = '';
    let key = '';
    try {
        const { Location, Key } = await s3.upload(params).promise();
        location = Location;
        key = Key;
    } catch (error) {
        console.log(error)
    }
    // console.log(location)
    let cloudFrontUrl = location.replace(process.env.BUCKET_URL, process.env.CDN_URL)

    // console.log(location, key);
    var newImage = new Image();
    newImage._id = objectId;
    newImage.name = "default.jpeg";
    newImage.size = "4.2 kB ";
    newImage.type = "png";
    newImage.encoding = "base64";
    newImage.path = cloudFrontUrl;
    // newImage.path = "default.jpg";
    let doc = await newImage.save()
    return doc;

    // return location;


}


module.exports = {
    uploadMediaFiles,
    downloadFileFromS3,
    getImageUrl,
    getImage,
    imageUpload,
    deleteFileFromS3,
    uploadMediaMultipleFiles
}
// Image upload api and function with whether s3 or normal file upload
// if you will do by s3 use the fucntion of above for tinfy the
