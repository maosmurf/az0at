import {Readable} from "stream";
import type {VercelRequest, VercelResponse} from "@vercel/node";
import {GetObjectCommand, HeadObjectCommand, S3Client} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.S3_AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.S3_AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.S3_AWS_SECRET_ACCESS_KEY as string,
    }
});

module.exports = async (req: VercelRequest, res: VercelResponse) => {
    const { bucket, key } = req.query;
    let params = {
        Bucket: bucket as string,
        Key: key as string,
    };

    try {
        const headResponse = await s3Client.send(new HeadObjectCommand(params));
        if (headResponse.ContentLength) {
            res.setHeader("Content-Length", headResponse.ContentLength);
        }
        if (headResponse.ContentType) {
            res.setHeader("Content-Type", headResponse.ContentType);
        }
        if (headResponse.ETag) {
            res.setHeader("ETag", headResponse.ETag);
        }

        const s3Item = await s3Client.send(new GetObjectCommand(params));
        const stream = s3Item.Body as Readable;
        stream.on("data", (chunk) => res.write(chunk));
        stream.once("end", () => {
            res.end();
        });
        stream.once("error", () => {
            res.end();
        });
    } catch (err) {
        console.error("Error", err);
        throw err;
    }


};
