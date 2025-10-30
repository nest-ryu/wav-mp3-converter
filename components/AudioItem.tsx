
import React from 'react';
import { AudioFile, ConversionStatus } from '../types';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { WaveIcon } from './icons/WaveIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ErrorIcon } from './icons/ErrorIcon';
import { CloseIcon } from './icons/CloseIcon';

interface AudioItemProps {
  file: AudioFile;
  onRemove: (id: string) => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

const StatusIndicator: React.FC<{ status: ConversionStatus }> = ({ status }) => {
  switch (status) {
    case ConversionStatus.CONVERTING:
      return <SpinnerIcon className="w-6 h-6 text-brand-blue animate-spin" />;
    case ConversionStatus.DONE:
      return <CheckCircleIcon className="w-6 h-6 text-green-400" />;
    case ConversionStatus.ERROR:
        return <ErrorIcon className="w-6 h-6 text-red-400" />;
    case ConversionStatus.QUEUED:
    default:
      return <div className="w-6 h-6 flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-brand-gray-500"></div></div>;
  }
};

const MP3InfoDisplay: React.FC<{info: AudioFile['mp3Info']}> = ({ info }) => {
    if (!info) return null;
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm text-brand-gray-300 mt-3 border-t border-brand-gray-700 pt-3">
            <div>
                <span className="font-semibold text-brand-gray-400 block">Size</span> {formatBytes(info.size)}
            </div>
            <div>
                <span className="font-semibold text-brand-gray-400 block">Bitrate</span> {info.bitrate} kbps
            </div>
            <div>
                <span className="font-semibold text-brand-gray-400 block">Sample Rate</span> {(info.sampleRate / 1000).toFixed(1)} kHz
            </div>
             <div>
                <span className="font-semibold text-brand-gray-400 block">Duration</span> {formatDuration(info.duration)}
            </div>
        </div>
    );
};


export const AudioItem: React.FC<AudioItemProps> = ({ file, onRemove }) => {
  return (
    <div className="bg-brand-gray-800 p-4 rounded-lg flex items-center space-x-4 shadow-md">
      <div className="flex-shrink-0">
         <StatusIndicator status={file.status} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-gray-100 truncate">{file.mp3Info?.fileName || file.originalFile.name}</p>
        <div className="text-xs text-brand-gray-400">
           {file.status === ConversionStatus.QUEUED && `WAV - ${formatBytes(file.originalFile.size)}`}
           {file.status === ConversionStatus.CONVERTING && 'Converting to MP3...'}
           {file.status === ConversionStatus.ERROR && <span className="text-red-400 font-medium">Error: {file.errorMessage}</span>}
        </div>
        {file.status === ConversionStatus.DONE && <MP3InfoDisplay info={file.mp3Info} />}
      </div>
      <div className="flex-shrink-0">
        {file.status === ConversionStatus.DONE && file.mp3Blob && file.mp3Info && (
          <a
            href={URL.createObjectURL(file.mp3Blob)}
            download={file.mp3Info.fileName}
            className="p-2 rounded-full hover:bg-brand-gray-700 transition-colors"
            title="Download MP3"
          >
            <DownloadIcon className="w-6 h-6 text-brand-blue" />
          </a>
        )}
        {file.status !== ConversionStatus.CONVERTING && (
            <button onClick={() => onRemove(file.id)} className="p-2 rounded-full hover:bg-brand-gray-700 transition-colors" title="Remove file">
                <CloseIcon className="w-5 h-5 text-brand-gray-400"/>
            </button>
        )}
      </div>
    </div>
  );
};
