import axios from "axios";
import { useState } from "react";

export default function FileUpload({ setResults }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type !== 'application/pdf') {
      setError("Please select a PDF file");
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setError(null);
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
    <div>
      <h2 style={{ 
        marginTop: 0, 
        marginBottom: '20px', 
        color: '#2c3e50',
        fontSize: '1.5rem'
      }}>
        Upload PDF for Analysis
      </h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="file" 
          accept=".pdf"
          onChange={handleFileChange}
          style={{
            display: 'block',
            width: '100%',
            padding: '10px',
            border: '2px dashed #ddd',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa',
            cursor: 'pointer'
          }}
        />
        {file && (
          <p style={{ 
            marginTop: '10px', 
            color: '#28a745', 
            fontSize: '14px',
            marginBottom: 0
          }}>
            ✓ Selected: {file.name}
          </p>
        )}
      </div>
      
      <button 
        onClick={upload} 
        disabled={loading || !file}
        style={{
          backgroundColor: loading || !file ? '#6c757d' : '#007bff',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '6px',
          fontSize: '16px',
          cursor: loading || !file ? 'not-allowed' : 'pointer',
          width: '100%',
          transition: 'background-color 0.2s'
        }}
      >
        {loading ? (
          <span>
            <span style={{ marginRight: '8px' }}>⏳</span>
            Analyzing... Please wait
          </span>
        ) : (
          "Analyze PDF"
        )}
      </button>
      
      {loading && (
        <div style={{ 
          marginTop: '15px', 
          textAlign: 'center',
          color: '#6c757d'
        }}>
          {/* Progress Bar */}
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '10px'
          }}>
            <div style={{
              width: `${progress.percentage}%`,
              height: '100%',
              backgroundColor: progress.percentage === 100 ? '#28a745' : '#007bff',
              transition: 'width 0.3s ease-in-out',
              borderRadius: '4px'
            }}></div>
          </div>
          
          {/* Percentage Display */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
              {getProgressMessage(progress.percentage)}
            </span>
            <span style={{ 
              fontSize: '16px', 
              fontWeight: 'bold',
              color: progress.percentage === 100 ? '#28a745' : '#007bff'
            }}>
              {Math.round(progress.percentage)}%
            </span>
          </div>
          
          {/* Estimated Time */}
          <p style={{ 
            marginTop: '5px', 
            fontSize: '12px',
            color: '#6c757d'
          }}>
            {progress.percentage < 100 
              ? `Estimated time remaining: ${Math.max(1, Math.round((100 - progress.percentage) / 10))} seconds`
              : "Analysis completed successfully!"
            }
          </p>
        </div>
      )}
      
      {error && (
        <div style={{ 
          color: '#dc3545', 
          marginTop: '15px', 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
      
      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
