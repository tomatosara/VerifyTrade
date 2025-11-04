export type PublicUrlOptions = {
  host: string;
  port: number | string;
  https?: boolean;
  basePath?: string;
  swaggerPath?: string;
};

const normalizeHost = (host: string): string => {
  if (host === '0.0.0.0' || host === '::') {
    return 'localhost';
  }

  return host;
};

const normalizeBasePath = (value?: string): string => {
  if (!value || value === '/') {
    return '';
  }

  const trimmed = value.replace(/^\/+/, '').replace(/\/+$/, '');
  return trimmed ? `/${trimmed}` : '';
};

const normalizeSwaggerPath = (value?: string): string => {
  if (!value) {
    return '/docs';
  }

  const ensuredLeading = value.startsWith('/') ? value : `/${value}`;
  return ensuredLeading.replace(/\/+$/, '') || '/docs';
};

export function buildPublicUrl(opts: PublicUrlOptions): string {
  const protocol = opts.https ? 'https' : 'http';
  const port = String(opts.port ?? '');
  const host = normalizeHost(opts.host);
  const base = normalizeBasePath(opts.basePath);
  const docs = normalizeSwaggerPath(opts.swaggerPath);

  const portSegment = port ? `:${port}` : '';

  return `${protocol}://${host}${portSegment}${base}${docs}`;
}
