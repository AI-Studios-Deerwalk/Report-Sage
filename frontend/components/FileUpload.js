import axios from "axios";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaCloudUploadAlt, 
  FaFilePdf, 
  FaCheckCircle, 
  FaSpinner, 
  FaExclamationCircle,
  FaTimes 
} from "react-icons/fa";

export default function FileUpload({ setResults }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    processFile(selectedFile);
  };

  const processFile = (selectedFile) => {
    if (selectedFile && selectedFile.type !== 'application/pdf') {
      setError("Please select a PDF file");
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setError(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    processFile(droppedFile);
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const upload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress({ current: 0, total: 10, percentage: 0 });
    
    // Start progress simulation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newPercentage = Math.min(prev.percentage + Math.random() * 15, 90);
        return {
          ...prev,
          percentage: newPercentage
        };
      });
    }, 1000);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(
        "http://localhost:8000/analyze-batch",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          params: { max_pages: 10 }
        }
      );
      
      // Complete the progress
      setProgress(prev => ({ ...prev, percentage: 100 }));
      
      setResults(res.data);
    } catch (err) {
      console.error("Upload error:", err);
      if (err.response) {
        setError(`Server error: ${err.response.status} - ${err.response.data?.detail || 'Unknown error'}`);
      } else if (err.request) {
        setError("Network error: Unable to connect to server. Make sure the backend is running on localhost:8000");
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      // Reset progress after a short delay
      setTimeout(() => {
        setProgress({ current: 0, total: 0, percentage: 0 });
      }, 2000);
    }
  };

  const getProgressMessage = (percentage) => {
    if (percentage < 20) return "Uploading PDF file...";
    if (percentage < 40) return "Extracting text from pages...";
    if (percentage < 60) return "Analyzing format compliance...";
    if (percentage < 80) return "Checking TU standards...";
    if (percentage < 100) return "Finalizing results...";
    return "Analysis complete!";
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload PDF for Analysis
        </h2>
        <p className="text-gray-600">
          Drag and drop your PDF file or click to browse
        </p>
      </div>
      
      {/* File Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer
          ${isDragOver 
            ? 'border-primary-400 bg-primary-50 scale-105' 
            : file 
              ? 'border-success-400 bg-success-50' 
              : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <motion.div
                animate={{ 
                  y: isDragOver ? -10 : 0,
                  scale: isDragOver ? 1.1 : 1
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <FaCloudUploadAlt className="mx-auto h-16 w-16 text-gray-400" />
              </motion.div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragOver ? 'Drop your PDF here' : 'Choose PDF file'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  or drag and drop it here
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="file-selected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center space-x-3">
                <FaFilePdf className="h-8 w-8 text-red-500" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <FaTimes className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <div className="flex items-center justify-center space-x-1 text-success-600">
                <FaCheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Ready to analyze</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Analyze Button */}
      <motion.button
        whileHover={{ scale: file && !loading ? 1.02 : 1 }}
        whileTap={{ scale: file && !loading ? 0.98 : 1 }}
        onClick={upload}
        disabled={loading || !file}
        className={`
          w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200
          ${loading || !file
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:from-primary-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
          }
        `}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <FaSpinner className="h-5 w-5" />
            </motion.div>
            <span>Analyzing Document...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <FaCloudUploadAlt className="h-5 w-5" />
            <span>Analyze PDF</span>
          </div>
        )}
      </motion.button>

      {/* Progress Section */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-4 border-t border-gray-200"
          >
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">
                  {getProgressMessage(progress.percentage)}
                </span>
                <span className="font-bold text-primary-600">
                  {Math.round(progress.percentage)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percentage}%` }}
                  transition={{ duration: 0.3 }}
                  className={`h-full rounded-full ${
                    progress.percentage === 100 
                      ? 'bg-gradient-to-r from-success-500 to-success-600' 
                      : 'progress-bar'
                  }`}
                />
              </div>
            </div>

            {/* Time Estimate */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {progress.percentage < 100 
                  ? `Estimated time remaining: ${Math.max(1, Math.round((100 - progress.percentage) / 10))} seconds`
                  : "Analysis completed successfully!"
                }
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center space-x-3 p-4 bg-error-50 border border-error-200 rounded-xl"
          >
            <FaExclamationCircle className="h-5 w-5 text-error-500 flex-shrink-0" />
            <p className="text-error-700 font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
