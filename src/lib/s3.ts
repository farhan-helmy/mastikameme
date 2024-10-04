"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY!,
  },
});

export const generateUploadS3PresignedUrl = async ({
  key,
  bucket,
  domain,
}: {
  key: string;
  bucket: string;
  domain: string;
}): Promise<{
  url: string;
  key: string;
}> => {
  const date = new Date();
  const formattedDate = `${date.getFullYear()}${`0${date.getMonth() + 1}`.slice(
    -2
  )}${`0${date.getDate()}`.slice(-2)}`;
  const transformedKey = `${domain}/${formattedDate}/${key}`;

  const putObjectCommand = new PutObjectCommand({
    Bucket: bucket,
    Key: transformedKey,
  });

  const res = await getSignedUrl(client, putObjectCommand, {
    expiresIn: 3600,
  });

  return {
    url: res,
    key: transformedKey,
  };
};
