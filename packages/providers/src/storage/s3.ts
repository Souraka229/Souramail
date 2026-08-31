import { AwsClient } from 'aws4fetch';
import type { StorageProvider } from '../interfaces.ts';

export interface S3Config {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** MinIO / some S3-compatibles need path-style URLs (bucket in the path). */
  forcePathStyle?: boolean;
}

/**
 * StorageProvider for raw MIME + attachments. Works against Cloudflare R2, AWS S3
 * and MinIO (local dev) via SigV4 — `aws4fetch` keeps this dependency-light
 * (docs/05 §2.1: "jamais de gros blobs en PG").
 */
export class S3StorageProvider implements StorageProvider {
  readonly name = 's3';
  private readonly client: AwsClient;
  private readonly base: string;
  private readonly bucket: string;
  private readonly pathStyle: boolean;

  constructor(cfg: S3Config) {
    this.client = new AwsClient({
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      region: cfg.region,
      service: 's3',
    });
    this.bucket = cfg.bucket;
    this.pathStyle = cfg.forcePathStyle ?? false;
    this.base = cfg.endpoint.replace(/\/$/, '');
  }

  private url(key: string): string {
    const k = key.replace(/^\/+/, '');
    if (this.pathStyle) return `${this.base}/${this.bucket}/${k}`;
    const vhost = this.base.replace('://', `://${this.bucket}.`);
    return `${vhost}/${k}`;
  }

  async put(key: string, body: Uint8Array | string, contentType?: string): Promise<void> {
    const res = await this.client.fetch(this.url(key), {
      method: 'PUT',
      body,
      headers: contentType ? { 'content-type': contentType } : undefined,
    });
    if (!res.ok) throw new Error(`S3 put ${key} → ${res.status} ${await res.text()}`);
  }

  async get(key: string): Promise<Uint8Array> {
    const res = await this.client.fetch(this.url(key));
    if (!res.ok) throw new Error(`S3 get ${key} → ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
  }

  async signedUrl(key: string, expiresInSec: number): Promise<string> {
    const signed = await this.client.sign(
      new Request(`${this.url(key)}?X-Amz-Expires=${expiresInSec}`),
      { aws: { signQuery: true } },
    );
    return signed.url;
  }

  async delete(key: string): Promise<void> {
    const res = await this.client.fetch(this.url(key), { method: 'DELETE' });
    if (!res.ok && res.status !== 404) {
      throw new Error(`S3 delete ${key} → ${res.status}`);
    }
  }
}
