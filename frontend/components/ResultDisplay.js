import { motion, AnimatePresence } from "framer-motion";
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaTimesCircle, 
  FaFileAlt, 
  FaChartPie,
  FaLightbulb,
  FaGraduationCap,
  FaSpellCheck,
  FaCog
} from "react-icons/fa";

export default function ResultDisplay({ results }) {
  if (!results || results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 text-center border border-gray-200"
      >
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaFileAlt className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-600 text-lg">
          Upload a PDF file and click "Analyze" to see results here.
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Get instant feedback on format compliance, grammar, and content quality
        </p>
      </motion.div>
    );
  }

  // Helper function to group items by page
  const groupByPage = (items) => {
    const grouped = {};
    items.forEach(item => {
      const page = item.page;
      if (!grouped[page]) {
        grouped[page] = [];
      }
      grouped[page].push(item);
    });
    return grouped;
  };

  // Check if we have the new format with overall summary
  const hasOverallSummary = results.overall_summary !== undefined;
  const categorizedResults = results.categorized_results || {};
  const phaseSummary = results.phase_summary || {};
  const isBatchShape =
    categorizedResults.errors ||
    categorizedResults.warnings ||
    categorizedResults.suggestions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center space-x-3 mb-6">
        <FaChartPie className="h-6 w-6 text-primary-600" />
        <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
      </div>
      
      {/* Overall Summary */}
      {hasOverallSummary && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-effect rounded-2xl p-6 border border-primary-200 bg-gradient-to-br from-primary-50 to-blue-50"
        >
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <FaGraduationCap className="h-4 w-4 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-primary-900 mb-2">Summary</h3>
              <p className="text-primary-800 whitespace-pre-line leading-relaxed">
                {results.overall_summary}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Phase Summary */}
      {Object.keys(phaseSummary).length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-2xl p-6 border border-gray-200"
        >
          <div className="flex items-center space-x-3 mb-6">
            <FaChartPie className="h-5 w-5 text-gray-600" />
            <h3 className="text-xl font-bold text-gray-900">Phase Breakdown</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(phaseSummary).map(([phase, summary], index) => (
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-xl p-6 text-center border-2 hover-lift"
                style={{ borderColor: summary.color }}
              >
                <div className="text-4xl mb-3">{summary.icon}</div>
                <div className="font-bold text-lg mb-2" style={{ color: summary.color }}>
                  {summary.title}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {summary.count}
                </div>
                <div className="text-sm text-gray-500">
                  {summary.count === 1 ? 'issue' : 'issues'}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* New batch shape: errors, warnings, suggestions */}
      {isBatchShape && (
        <div className="space-y-6">
          {categorizedResults.errors && categorizedResults.errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-effect rounded-2xl p-6 border-2 border-error-300 bg-gradient-to-br from-error-50 to-red-50"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-error-100 rounded-full flex items-center justify-center">
                  <FaTimesCircle className="h-5 w-5 text-error-600" />
                </div>
                <h3 className="text-xl font-bold text-error-700">
                  Critical Errors ({categorizedResults.errors.length})
                </h3>
              </div>
              <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                    className="bg-white rounded-lg p-4 border border-error-200 hover-lift"
                  >
                    <div className="flex items-start space-x-3">
                      <FaFileAlt className="h-4 w-4 text-error-500 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                      <div className="space-y-3">
                        {categorizedResults.errors.map((error, errorIndex) => {
                          // Extract section tag if it exists (e.g., [COVER], [TABLE OF CONTENTS])
                          const sectionMatch = error.text.match(/^\[([^\]]+)\]/);
                          const sectionTag = sectionMatch ? sectionMatch[1] : null;
                          const remainingText = sectionTag ? error.text.replace(/^\[[^\]]+\]\s*/, '') : error.text;
                          
                          return (
                            <div key={errorIndex} className="flex items-start space-x-3 p-3 bg-error-25 rounded-lg border-l-4 border-error-400 hover:bg-error-50 transition-colors">
                              <div className="flex-shrink-0 w-6 h-6 bg-error-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {errorIndex + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  {sectionTag && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800 border border-error-200">
                                      {sectionTag}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                    Page {error.page}
                                  </span>
                                </div>
                                <p className="text-error-800 text-sm leading-relaxed font-medium">
                                  {remainingText}
                                </p>
                        </div>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
              </div>
            </motion.div>
          )}

          {categorizedResults.warnings && categorizedResults.warnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-effect rounded-2xl p-6 border-2 border-warning-300 bg-gradient-to-br from-warning-50 to-yellow-50"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center">
                  <FaExclamationTriangle className="h-5 w-5 text-warning-600" />
                </div>
                <h3 className="text-xl font-bold text-warning-700">
                  Warnings ({categorizedResults.warnings.length})
                </h3>
              </div>
              <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                    className="bg-white rounded-lg p-4 border border-warning-200 hover-lift"
                  >
                    <div className="flex items-start space-x-3">
                      <FaFileAlt className="h-4 w-4 text-warning-500 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                      <div className="space-y-3">
                        {categorizedResults.warnings.map((warning, warningIndex) => {
                          // Extract section tag if it exists (e.g., [COVER], [TABLE OF CONTENTS])
                          const sectionMatch = warning.text.match(/^\[([^\]]+)\]/);
                          const sectionTag = sectionMatch ? sectionMatch[1] : null;
                          const remainingText = sectionTag ? warning.text.replace(/^\[[^\]]+\]\s*/, '') : warning.text;
                          
                          return (
                            <div key={warningIndex} className="flex items-start space-x-3 p-3 bg-warning-25 rounded-lg border-l-4 border-warning-400 hover:bg-warning-50 transition-colors">
                              <div className="flex-shrink-0 w-6 h-6 bg-warning-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {warningIndex + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  {sectionTag && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800 border border-warning-200">
                                      {sectionTag}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                    Page {warning.page}
                                  </span>
                                </div>
                                <p className="text-warning-800 text-sm leading-relaxed font-medium">
                                  {remainingText}
                                </p>
                        </div>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
              </div>
            </motion.div>
          )}

          {categorizedResults.suggestions && categorizedResults.suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-effect rounded-2xl p-6 border-2 border-success-300 bg-gradient-to-br from-success-50 to-green-50"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                  <FaLightbulb className="h-5 w-5 text-success-600" />
                </div>
                <h3 className="text-xl font-bold text-success-700">
                  Suggestions ({categorizedResults.suggestions.length})
                </h3>
              </div>
              <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                    className="bg-white rounded-lg p-4 border border-success-200 hover-lift"
                  >
                    <div className="flex items-start space-x-3">
                      <FaFileAlt className="h-4 w-4 text-success-500 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                      <div className="space-y-3">
                        {categorizedResults.suggestions.map((suggestion, suggestionIndex) => {
                          // Extract section tag if it exists (e.g., [COVER], [TABLE OF CONTENTS])
                          const sectionMatch = suggestion.text.match(/^\[([^\]]+)\]/);
                          const sectionTag = sectionMatch ? sectionMatch[1] : null;
                          const remainingText = sectionTag ? suggestion.text.replace(/^\[[^\]]+\]\s*/, '') : suggestion.text;
                          
                          return (
                            <div key={suggestionIndex} className="flex items-start space-x-3 p-3 bg-success-25 rounded-lg border-l-4 border-success-400 hover:bg-success-50 transition-colors">
                              <div className="flex-shrink-0 w-6 h-6 bg-success-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {suggestionIndex + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  {sectionTag && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 border border-success-200">
                                      {sectionTag}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                    Page {suggestion.page}
                                  </span>
                                </div>
                                <p className="text-success-800 text-sm leading-relaxed font-medium">
                                  {remainingText}
                                </p>
                        </div>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
              </div>
            </motion.div>
          )}

          {categorizedResults.enhancement && categorizedResults.enhancement.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-effect rounded-2xl p-6 border-2 border-success-300 bg-gradient-to-br from-success-50 to-green-50"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                  <FaLightbulb className="h-5 w-5 text-success-600" />
                </div>
                <h3 className="text-xl font-bold text-success-700">
                  Enhancement Suggestions ({categorizedResults.enhancement.length})
                </h3>
              </div>
              <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                    className="bg-white rounded-lg p-4 border border-success-200 hover-lift"
                  >
                    <div className="flex items-start space-x-3">
                      <FaFileAlt className="h-4 w-4 text-success-500 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                      <div className="space-y-3">
                        {categorizedResults.enhancement.map((enhancement, enhancementIndex) => {
                          // Extract section tag if it exists (e.g., [COVER], [TABLE OF CONTENTS])
                          const sectionMatch = enhancement.text.match(/^\[([^\]]+)\]/);
                          const sectionTag = sectionMatch ? sectionMatch[1] : null;
                          const remainingText = sectionTag ? enhancement.text.replace(/^\[[^\]]+\]\s*/, '') : enhancement.text;
                          
                          return (
                            <div key={enhancementIndex} className="flex items-start space-x-3 p-3 bg-success-25 rounded-lg border-l-4 border-success-400 hover:bg-success-50 transition-colors">
                              <div className="flex-shrink-0 w-6 h-6 bg-success-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {enhancementIndex + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                  {sectionTag && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 border border-success-200">
                                      {sectionTag}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                    Page {enhancement.page}
                                  </span>
                                </div>
                                <p className="text-success-800 text-sm leading-relaxed font-medium">
                                  {remainingText}
                                </p>
                        </div>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
              </div>
            </motion.div>
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
          <div style={{ 
              marginBottom: '15px',
              padding: '12px',
              backgroundColor: '#fff',
              borderRadius: '6px',
              border: '1px solid #ffcdd2',
              fontSize: '14px',
              lineHeight: '1.4',
              color: '#721c24'
            }}>
            <div style={{ paddingLeft: '8px' }}>
              {categorizedResults.structure.map((error, errorIndex) => {
                // Extract section tag if it exists (e.g., [COVER], [TABLE OF CONTENTS])
                const sectionMatch = error.text.match(/^\[([^\]]+)\]/);
                const sectionTag = sectionMatch ? sectionMatch[1] : null;
                const remainingText = sectionTag ? error.text.replace(/^\[[^\]]+\]\s*/, '') : error.text;
                
                return (
                  <div key={errorIndex} style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: '#fff8f8',
                    borderRadius: '8px',
                    borderLeft: '4px solid #dc3545',
                    marginBottom: '12px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#ffebee'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#fff8f8'}
                  >
                    <div style={{
                      flexShrink: 0,
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {errorIndex + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {sectionTag && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: '#ffebee',
                            color: '#721c24',
                            border: '1px solid #ffcdd2'
                          }}>
                            {sectionTag}
                          </span>
                        )}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: '#f5f5f5',
                          color: '#374151'
                        }}>
                          Page {error.page}
                        </span>
                      </div>
                      <p style={{
                        color: '#721c24',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        fontWeight: '500',
                        margin: 0
                      }}>
                        {remainingText}
                      </p>
              </div>
                  </div>
                );
              })}
              </div>
            </div>
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
          <div style={{ 
              marginBottom: '15px',
              padding: '15px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #ffeaa7',
              boxShadow: '0 2px 4px rgba(255, 193, 7, 0.1)'
            }}>
            <div style={{ paddingLeft: '8px' }}>
              {categorizedResults.grammar.map((error, errorIndex) => {
                // Extract section tag if it exists (e.g., [COVER], [TABLE OF CONTENTS])
                const sectionMatch = error.text.match(/^\[([^\]]+)\]/);
                const sectionTag = sectionMatch ? sectionMatch[1] : null;
                const remainingText = sectionTag ? error.text.replace(/^\[[^\]]+\]\s*/, '') : error.text;
                
                return (
                  <div key={errorIndex} style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: '#fffdf7',
                    borderRadius: '8px',
                    borderLeft: '4px solid #ffc107',
                    marginBottom: '12px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#fffbf0'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#fffdf7'}
                  >
              <div style={{ 
                      flexShrink: 0,
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#ffc107',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {errorIndex + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {sectionTag && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: '#fff3cd',
                            color: '#856404',
                            border: '1px solid #ffeaa7'
                          }}>
                            {sectionTag}
                          </span>
                        )}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: '#f5f5f5',
                          color: '#374151'
                        }}>
                          Page {error.page}
                        </span>
              </div>
                      <p style={{
                        color: '#856404',
                    fontSize: '14px',
                    lineHeight: '1.5',
                        fontWeight: '500',
                        margin: 0
                  }}>
                        {remainingText}
                      </p>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
        </div>
      )}

      {/* Phase 3: Content Enhancement Suggestions - Green */}
      {!isBatchShape && categorizedResults.enhancement && categorizedResults.enhancement.length > 0 && (
        <div style={{ 
          padding: '25px', 
          border: '2px solid #28a745', 
          borderRadius: '12px',
          backgroundColor: '#f0fff4',
          marginBottom: '20px'
        }}>
          <h3 style={{ color: '#28a745', marginTop: 0, marginBottom: '20px', fontSize: '1.5rem' }}>
            💡 Phase 3: Content Enhancement Suggestions ({categorizedResults.enhancement.length})
          </h3>
          <p style={{ color: '#155724', marginBottom: '15px', fontSize: '14px' }}>
            Content improvement suggestions for better quality.
          </p>
          <div style={{ 
              marginBottom: '15px',
              padding: '15px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #c3e6cb',
              boxShadow: '0 2px 4px rgba(40, 167, 69, 0.1)'
            }}>
            <div style={{ paddingLeft: '8px' }}>
              {categorizedResults.enhancement.map((error, errorIndex) => {
                // Extract section tag if it exists (e.g., [COVER], [TABLE OF CONTENTS])
                const sectionMatch = error.text.match(/^\[([^\]]+)\]/);
                const sectionTag = sectionMatch ? sectionMatch[1] : null;
                const remainingText = sectionTag ? error.text.replace(/^\[[^\]]+\]\s*/, '') : error.text;
                
                return (
                  <div key={errorIndex} style={{ 
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: '#f8fff9',
                    borderRadius: '8px',
                    borderLeft: '4px solid #28a745',
                    marginBottom: '12px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f0fff4'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f8fff9'}
                  >
              <div style={{ 
                      flexShrink: 0,
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {errorIndex + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {sectionTag && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            backgroundColor: '#d4edda',
                            color: '#155724',
                            border: '1px solid #c3e6cb'
                          }}>
                            {sectionTag}
                          </span>
                        )}
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: '#f5f5f5',
                          color: '#374151'
                        }}>
                          Page {error.page}
                        </span>
              </div>
                      <p style={{
                        color: '#155724',
                    fontSize: '14px',
                    lineHeight: '1.5',
                        fontWeight: '500',
                        margin: 0
                  }}>
                        {remainingText}
                      </p>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
        </div>
      )}

      

      {/* No Issues Message */}
      {hasOverallSummary && results.total_errors_found === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="glass-effect rounded-2xl p-8 border-2 border-success-300 bg-gradient-to-br from-success-50 to-green-50 text-center"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
            className="text-6xl mb-4"
          >
            ✅
          </motion.div>
          <h3 className="text-2xl font-bold text-success-700 mb-3">
            Perfect! No Issues Found
          </h3>
          <p className="text-success-800 text-lg">
            All {results.total_pages_analyzed} pages comply with TU format standards.
          </p>
          <div className="mt-4 inline-flex items-center space-x-2 bg-success-100 px-4 py-2 rounded-full">
            <FaCheckCircle className="h-4 w-4 text-success-600" />
            <span className="text-success-700 font-medium">Ready for submission</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
