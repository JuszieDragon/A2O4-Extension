export enum DownloadFormat {
  AZW3 = "AZW3",
  EPUB = "EPUB",
  MOBI = "MOBI",
  PDF = "PDF",
  HTML = "HTML"
}

export type A2O4Request = {
  url: string,
  devices_to_upload_to: string[],
  devices_to_queue: string[],
  fandom_override: string | null,
  format: DownloadFormat
}
