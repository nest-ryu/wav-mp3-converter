
import React, { useState, useCallback } from 'react';
import { AudioFile, ConversionStatus, Mp3Info } from './types';
import { FileDropzone } from './components/FileDropzone';
import { AudioItem } from './components/AudioItem';
import { WaveIcon } from './components/icons/WaveIcon';
import { SpinnerIcon } from './components/icons/SpinnerIcon';

const App: React.FC = () => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);

  const updateFileStatus = (id: string, status: ConversionStatus) => {
    setAudioFiles(prev => prev.map(f => f.id === id ? { ...f, status, errorMessage: undefined } : f));
  };

  const updateFileResult = (id: string, mp3Blob: Blob, mp3Info: Mp3Info) => {
    setAudioFiles(prev => prev.map(f => f.id === id ? { ...f, status: ConversionStatus.DONE, mp3Blob, mp3Info } : f));
  };
  
  const updateFileError = (id: string, message: string) => {
    setAudioFiles(prev => prev.map(f => f.id === id ? { ...f, status: ConversionStatus.ERROR, errorMessage: message } : f));
  };
  
  const parseWav = (arrayBuffer: ArrayBuffer) => {
    const view = new DataView(arrayBuffer);
    if (view.getUint32(0, false) !== 0x52494646 || view.getUint32(8, false) !== 0x57415645) {
      throw new Error("Not a valid WAV file.");
    }
    const channels = view.getUint16(22, true);
    const sampleRate = view.getUint32(24, true);
    const bitsPerSample = view.getUint16(34, true);

    if (bitsPerSample !== 16) throw new Error("Only 16-bit WAV files are supported.");

    let dataOffset = 12;
    while (dataOffset < view.byteLength) {
      if (view.getUint32(dataOffset, false) === 0x64617461) {
        break;
      }
      dataOffset += 8 + view.getUint32(dataOffset + 4, true);
    }
    if (dataOffset >= view.byteLength) throw new Error("Could not find data chunk in WAV file.");

    const dataSize = view.getUint32(dataOffset + 4, true);
    const pcmDataOffset = dataOffset + 8;

    const duration = dataSize / (sampleRate * channels * (bitsPerSample / 8));
    
    return { channels, sampleRate, pcmDataOffset, dataSize, duration };
  };

  const convertSingleFile = async (audioFile: AudioFile) => {
    if (!audioFile || audioFile.status !== ConversionStatus.QUEUED) return;
    updateFileStatus(audioFile.id, ConversionStatus.CONVERTING);

    try {
      const arrayBuffer = await audioFile.originalFile.arrayBuffer();
      const wavInfo = parseWav(arrayBuffer);

      const pcmSamples = new Int16Array(arrayBuffer, wavInfo.pcmDataOffset, wavInfo.dataSize / 2);

      const mp3Encoder = new lamejs.Mp3Encoder(wavInfo.channels, wavInfo.sampleRate, 320);
      const mp3Chunks: Int8Array[] = [];
      const chunkSize = 1152 * wavInfo.channels;

      let samplesLeft: Int16Array;
      let samplesRight: Int16Array | undefined = undefined;

      if (wavInfo.channels === 2) {
        samplesLeft = new Int16Array(pcmSamples.length / 2);
        samplesRight = new Int16Array(pcmSamples.length / 2);
        for (let i = 0; i < pcmSamples.length / 2; i++) {
          samplesLeft[i] = pcmSamples[i * 2];
          samplesRight[i] = pcmSamples[i * 2 + 1];
        }
      } else {
        samplesLeft = pcmSamples;
      }

      for (let i = 0; i < samplesLeft.length; i += chunkSize) {
        const leftChunk = samplesLeft.subarray(i, i + chunkSize);
        const rightChunk = samplesRight ? samplesRight.subarray(i, i + chunkSize) : undefined;
        const mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);
        if (mp3buf.length > 0) mp3Chunks.push(mp3buf);
      }
      const finalMp3buf = mp3Encoder.flush();
      if (finalMp3buf.length > 0) mp3Chunks.push(finalMp3buf);
      
      const mp3Blob = new Blob(mp3Chunks, { type: 'audio/mpeg' });
      const newFileName = audioFile.originalFile.name.replace(/\.[^/.]+$/, "") + ".mp3";

      updateFileResult(audioFile.id, mp3Blob, {
        fileName: newFileName,
        size: mp3Blob.size,
        bitrate: 320,
        sampleRate: wavInfo.sampleRate,
        duration: wavInfo.duration
      });

    } catch (error) {
      console.error(error);
      updateFileError(audioFile.id, (error as Error).message);
    }
  };

  const handleConvertAll = async () => {
    setIsConverting(true);
    const filesToConvert = audioFiles.filter(f => f.status === ConversionStatus.QUEUED);
    for (const file of filesToConvert) {
      await convertSingleFile(file);
    }
    setIsConverting(false);
  };

  const handleFilesAdded = useCallback((files: File[]) => {
    const newAudioFiles: AudioFile[] = files
      .filter(file => file.type === 'audio/wav' || file.name.toLowerCase().endsWith('.wav'))
      .map(file => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        originalFile: file,
        status: ConversionStatus.QUEUED,
      }));
    setAudioFiles(prev => [...prev, ...newAudioFiles]);
  }, []);
  
  const handleRemoveFile = (id: string) => {
    setAudioFiles(prev => prev.filter(f => f.id !== id));
  };
  
  const handleReset = () => {
    setAudioFiles([]);
    setIsConverting(false);
  }

  const queuedFilesCount = audioFiles.filter(f => f.status === ConversionStatus.QUEUED).length;

  return (
    <div className="min-h-screen text-brand-gray-100 font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <WaveIcon className="w-10 h-10 text-brand-blue" />
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">WAV to MP3 Converter</h1>
          </div>
          <p className="text-lg text-brand-gray-400">High-quality, in-browser conversion at 320kbps.</p>
        </header>

        <main className="bg-brand-gray-900 rounded-2xl shadow-2xl shadow-brand-gray-950/50 p-6 md:p-8 mb-8">
          <FileDropzone onFilesAdded={handleFilesAdded} disabled={isConverting} />

          {audioFiles.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-semibold text-white">Conversion Queue ({audioFiles.length})</h2>
                 <button 
                  onClick={handleReset}
                  disabled={isConverting}
                  className="px-4 py-2 text-sm font-medium text-brand-gray-300 bg-brand-gray-700 rounded-lg hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-gray-900 focus:ring-brand-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-4">
                {audioFiles.map(file => (
                  <AudioItem key={file.id} file={file} onRemove={handleRemoveFile} />
                ))}
              </div>

              {queuedFilesCount > 0 && (
                <div className="mt-8 text-center">
                  <button
                    onClick={handleConvertAll}
                    disabled={isConverting}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 text-lg font-bold bg-brand-blue text-brand-gray-950 px-8 py-4 rounded-xl hover:bg-brand-blue-dark focus:outline-none focus:ring-4 focus:ring-brand-blue/50 disabled:opacity-60 disabled:cursor-wait transition-all duration-300 ease-in-out transform hover:scale-105"
                  >
                    {isConverting ? (
                      <>
                        <SpinnerIcon className="w-6 h-6 animate-spin"/>
                        <span>Converting...</span>
                      </>
                    ) : `Convert ${queuedFilesCount} File${queuedFilesCount > 1 ? 's' : ''}`}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
        
        <footer className="text-center text-brand-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} WAV to MP3 Converter Pro. All conversions are done locally in your browser.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
