import { useState } from "react";
import FileUpload from "../components/FileUpload";
import ResultDisplay from "../components/ResultDisplay";

export default function Home() {
  const [results, setResults] = useState([]);

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#2c3e50', 
        marginBottom: '30px',
        fontSize: '2.5rem',
        fontWeight: '300'
      }}>
        TU Project Report Checker
      </h1>
      
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '30px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px'
      }}>
        <FileUpload setResults={setResults} />
      </div>
      
      <ResultDisplay results={results} />
    </div>
  );
}
