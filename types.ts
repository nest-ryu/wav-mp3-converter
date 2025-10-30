
export enum ConversionStatus {
  QUEUED,
  CONVERTING,
  DONE,
  ERROR,
}

export interface Mp3Info {
  fileName: string;
  size: number;
  bitrate: number;
  sampleRate: number;
  duration: number;
}

export interface AudioFile {
  id: string;
  originalFile: File;
  status: ConversionStatus;
  mp3Blob?: Blob;
  mp3Info?: Mp3Info;
  errorMessage?: string;
}

// Type definitions for lamejs loaded from CDN
export declare class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number);
    encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
    flush(): Int8Array;
}

declare global {
    const lamejs: {
        Mp3Encoder: typeof Mp3Encoder;
    };
}
