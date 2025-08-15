export default function ResultDisplay({ results }) {
  if (!results || results.length === 0) {
    return (
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <p style={{ textAlign: 'center', color: '#666', margin: 0 }}>
          Upload a PDF file and click "Analyze" to see results here.
        </p>
      </div>
    );
  }

  // Check if we have the new format with overall summary
  const hasOverallSummary = results.overall_summary !== undefined;
  const categorizedResults = results.categorized_results || {};
  const phaseSummary = results.phase_summary || {};
  const isBatchShape =
    categorizedResults.errors ||
    categorizedResults.warnings;

  return (
    <div style={{ marginTop: '20px' }}>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>Analysis Results</h2>
      
      {/* Overall Summary */}
      {hasOverallSummary && (
        <div style={{
          padding: '20px',
          backgroundColor: '#eef6ff',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid #b6daff',
          whiteSpace: 'pre-line',
          color: '#0c3c78'
        }}>
          {results.overall_summary}
        </div>
      )}

      {/* Phase Summary */}
      {Object.keys(phaseSummary).length > 0 && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ color: '#333', marginTop: 0, marginBottom: '15px', fontSize: '1.3rem' }}>
            📊 Phase Breakdown
          </h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {Object.entries(phaseSummary).map(([phase, summary]) => (
              <div key={phase} style={{ 
                flex: '1',
                minWidth: '200px',
                padding: '15px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: `2px solid ${summary.color}`,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{summary.icon}</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  color: summary.color,
                  marginBottom: '5px'
                }}>
                  {summary.title}
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
                  {summary.count}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  {summary.count === 1 ? 'issue' : 'issues'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New batch shape: errors, warnings */}
      {isBatchShape && (
        <div>
          {categorizedResults.errors && categorizedResults.errors.length > 0 && (
            <div style={{ 
              padding: '25px', 
              border: '2px solid #dc3545', 
              borderRadius: '12px',
              backgroundColor: '#fff5f5',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#dc3545', marginTop: 0, marginBottom: '20px', fontSize: '1.5rem' }}>
                🚨 Errors ({categorizedResults.errors.length})
              </h3>
              {categorizedResults.errors.map((item, i) => (
                <div key={i} style={{ 
                  marginBottom: '10px',
                  padding: '12px',
                  backgroundColor: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #ffcdd2',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  color: '#721c24'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    📄 Page {item.page}
                  </div>
                  <div>→ {item.text}</div>
                </div>
              ))}
            </div>
          )}

          {categorizedResults.warnings && categorizedResults.warnings.length > 0 && (
            <div style={{ 
              padding: '25px', 
              border: '2px solid #ffc107', 
              borderRadius: '12px',
              backgroundColor: '#fffbf0',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: '#ffc107', marginTop: 0, marginBottom: '20px', fontSize: '1.5rem' }}>
                ⚠️ Warnings ({categorizedResults.warnings.length})
              </h3>
              {categorizedResults.warnings.map((item, i) => (
                <div key={i} style={{ 
                  marginBottom: '10px',
                  padding: '12px',
                  backgroundColor: '#fff',
                  borderRadius: '6px',
                  border: '1px solid #ffeaa7',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  color: '#856404'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    📄 Page {item.page}
                  </div>
                  <div>{item.text}</div>
                </div>
              ))}
            </div>
          )}


        </div>
      )}

      {/* Phase 1: Structure Errors - Red */}
      {!isBatchShape && categorizedResults.structure && categorizedResults.structure.length > 0 && (
        <div style={{ 
          padding: '25px', 
          border: '2px solid #dc3545', 
          borderRadius: '12px',
          backgroundColor: '#fff5f5',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#dc3545', marginTop: 0, marginBottom: '20px', fontSize: '1.5rem' }}>
            🚨 Phase 1: Structure Errors ({categorizedResults.structure.length})
          </h3>
          <p style={{ color: '#721c24', marginBottom: '15px', fontSize: '14px' }}>
            Critical structure and formatting issues that need immediate attention.
          </p>
          {categorizedResults.structure.map((error, i) => (
            <div key={i} style={{ 
              marginBottom: '10px',
              padding: '12px',
              backgroundColor: '#fff',
              borderRadius: '6px',
              border: '1px solid #ffcdd2',
              fontSize: '14px',
              lineHeight: '1.4',
              color: '#721c24'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                📄 Page {error.page}
              </div>
              <div>→ {error.text}</div>
            </div>
          ))}
        </div>
      )}

      {/* Phase 2: Grammar & Spelling Errors - Yellow */}
      {!isBatchShape && categorizedResults.grammar && categorizedResults.grammar.length > 0 && (
        <div style={{ 
          padding: '25px', 
          border: '2px solid #ffc107', 
          borderRadius: '12px',
          backgroundColor: '#fffbf0',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#ffc107', marginTop: 0, marginBottom: '20px', fontSize: '1.5rem' }}>
            ⚠️ Phase 2: Grammar & Spelling Errors ({categorizedResults.grammar.length})
          </h3>
          <p style={{ color: '#856404', marginBottom: '15px', fontSize: '14px' }}>
            Grammar and spelling errors that need correction.
          </p>
          {categorizedResults.grammar.map((error, i) => (
            <div key={i} style={{ 
              marginBottom: '15px',
              padding: '15px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #ffeaa7',
              boxShadow: '0 2px 4px rgba(255, 193, 7, 0.1)'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold', 
                marginBottom: '8px',
                color: '#ffc107'
              }}>
                📄 Page {error.page}
              </div>
              <div style={{ 
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#856404'
              }}>
                {error.text}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Phase 3: Content Enhancement Suggestions - Blue */}
      {!isBatchShape && categorizedResults.enhancement && categorizedResults.enhancement.length > 0 && (
        <div style={{ 
          padding: '25px', 
          border: '2px solid #17a2b8', 
          borderRadius: '12px',
          backgroundColor: '#f0f8ff',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#17a2b8', marginTop: 0, marginBottom: '20px', fontSize: '1.5rem' }}>
            💡 Phase 3: Content Enhancement Suggestions ({categorizedResults.enhancement.length})
          </h3>
          <p style={{ color: '#0c5460', marginBottom: '15px', fontSize: '14px' }}>
            Content improvement suggestions for better quality.
          </p>
          {categorizedResults.enhancement.map((error, i) => (
            <div key={i} style={{ 
              marginBottom: '15px',
              padding: '15px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #b3d9ff',
              boxShadow: '0 2px 4px rgba(23, 162, 184, 0.1)'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 'bold', 
                marginBottom: '8px',
                color: '#17a2b8'
              }}>
                📄 Page {error.page}
              </div>
              <div style={{ 
                fontSize: '14px',
                lineHeight: '1.5',
                color: '#0c5460'
              }}>
                {error.text}
              </div>
            </div>
          ))}
        </div>
      )}

      

      {/* No Issues Message */}
      {hasOverallSummary && results.total_errors_found === 0 && (
        <div style={{ 
          padding: '25px', 
          border: '2px solid #28a745', 
          borderRadius: '12px',
          backgroundColor: '#f8fff9',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
          <h3 style={{ color: '#28a745', marginTop: 0, marginBottom: '10px', fontSize: '1.5rem' }}>
            Perfect! No Issues Found
          </h3>
          <p style={{ color: '#155724', fontSize: '16px', margin: 0 }}>
            All {results.total_pages_analyzed} pages comply with TU format standards.
          </p>
        </div>
      )}


    </div>
  );
}
