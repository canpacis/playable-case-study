import * as Minio from "minio";

export function initStorage() {
  return new Minio.Client({
    endPoint: "localhost",
    port: 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ROOT_USER,
    secretKey: process.env.MINIO_ROOT_PASSWORD,
  });
}

export const getAppBucket = () => process.env.MINIO_DEFAULT_BUCKETS!;
