import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const fileType = searchParams.get("fileType");

  if (!fileType) {
    return NextResponse.json(
      { error: "fileType 쿼리가 필요합니다" },
      { status: 400 }
    );
  }

  const fileExtension = fileType.split("/")[1];
  const key = `profile/${uuidv4()}.${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: fileType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 60 });

  return NextResponse.json({ uploadUrl: url, key });
}
