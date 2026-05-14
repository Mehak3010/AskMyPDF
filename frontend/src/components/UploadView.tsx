import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

interface UploadViewProps {
  onUploadSuccess: (filename: string, fileUrl: string) => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collection, setCollection] = useState("General");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      // For Phase 4, we'll process files sequentially or in parallel
      // We'll update the success state after all are done
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('collection', collection);

        await axios.post('http://localhost:8001/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setIsSuccess(true);
      // If only one file, we can still provide the URL for preview
      const firstFileUrl = URL.createObjectURL(acceptedFiles[0]);
      
      setTimeout(() => {
        onUploadSuccess(
          acceptedFiles.length > 1 ? `${acceptedFiles.length} files` : acceptedFiles[0].name, 
          firstFileUrl
        );
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [onUploadSuccess, collection]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true, // Enabled multiple files
    disabled: isUploading || isSuccess,
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 bg-slate-50 dark:bg-slate-950">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full text-center space-y-8"
      >
        <div className="space-y-3">
          <motion.h1 
            className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            Multi-PDF <span className="text-primary">Intelligence</span>
          </motion.h1>
          <motion.p className="text-lg text-slate-500 dark:text-slate-400">
            Upload multiple documents and ask cross-PDF questions.
          </motion.p>
        </div>

        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2 justify-center">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Collection:</span>
            <select 
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="General">General</option>
              <option value="Research">Research</option>
              <option value="Work">Work</option>
              <option value="Finance">Finance</option>
              <option value="Personal">Personal</option>
            </select>
          </div>

          <Card className="border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div
                {...getRootProps()}
                className={cn(
                  "relative group cursor-pointer p-16 transition-all duration-300 ease-in-out",
                  isDragActive ? "bg-primary/5" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50",
                  (isUploading || isSuccess) && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center space-y-6">
                  <motion.div 
                    animate={isUploading ? { scale: [1, 1.1, 1], rotate: 360 } : {}}
                    transition={isUploading ? { repeat: Infinity, duration: 2 } : {}}
                    className={cn(
                      "p-6 rounded-2xl transition-all duration-300 shadow-inner",
                      isDragActive ? "bg-primary text-white" : "bg-primary/10 text-primary",
                      isSuccess && "bg-green-100 text-green-600"
                    )}
                  >
                    {isUploading ? (
                      <Loader2 className="h-12 w-12 animate-spin" />
                    ) : isSuccess ? (
                      <CheckCircle2 className="h-12 w-12" />
                    ) : (
                      <Upload className="h-12 w-12" />
                    )}
                  </motion.div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {isUploading ? "Uploading & Analyzing..." : isSuccess ? "Success!" : "Drop multiple PDFs here"}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto">
                      {isUploading 
                        ? "Building a global knowledge base..." 
                        : isSuccess 
                          ? "Preparing cross-document search..." 
                          : "Drag multiple files to start cross-PDF analysis"}
                    </p>
                  </div>
                </div>
                
                {isUploading && (
                  <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full overflow-hidden">
                    <motion.div 
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="h-full bg-primary w-1/3"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl"
            >
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-center space-x-6 text-xs text-slate-400 font-medium uppercase tracking-wider">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Secure</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Fast Extraction</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Private</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
