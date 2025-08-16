import { useState, useEffect } from "react";
import Head from "next/head";
import FileUpload from "../components/FileUpload";
import ResultDisplay from "../components/ResultDisplay";
import { motion } from "framer-motion";
import { FaUniversity, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaLightbulb } from "react-icons/fa";

export default function Home() {
  const [results, setResults] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getStatsFromResults = () => {
    if (!results || results.length === 0) {
      return { totalPages: 0, errors: 0, warnings: 0, suggestions: 0, success: 0 };
    }

    const categorizedResults = results.categorized_results || {};
    const errors = categorizedResults.errors?.length || 0;
    const warnings = categorizedResults.warnings?.length || 0;
    const suggestions = categorizedResults.suggestions?.length || categorizedResults.enhancement?.length || 0;
    const totalPages = results.total_pages_analyzed || 0;
    const success = errors === 0 && warnings === 0 && totalPages > 0 ? 1 : 0;

    return { totalPages, errors, warnings, suggestions, success };
  };

  const stats = getStatsFromResults();

  return (
    <>
      <Head>
        <title>TU Project Report Checker - Professional Document Analysis</title>
        <meta name="description" content="Professional document analysis tool for TU project reports" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <FaUniversity className="h-8 w-8 text-primary-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">TU Report Checker</h1>
                  <p className="text-sm text-gray-500">Professional Document Analysis</p>
                </div>
              </div>
              
              {/* Stats Display */}
              {stats.totalPages > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-4"
                >
                  {stats.success > 0 && (
                    <div className="flex items-center space-x-1 text-success-600">
                      <FaCheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Perfect</span>
                    </div>
                  )}
                  {stats.errors > 0 && (
                    <div className="flex items-center space-x-1 text-error-600">
                      <FaTimesCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{stats.errors} Errors</span>
                    </div>
                  )}
                  {stats.warnings > 0 && (
                    <div className="flex items-center space-x-1 text-warning-600">
                      <FaExclamationTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">{stats.warnings} Warnings</span>
                    </div>
                  )}
                  {stats.suggestions > 0 && (
                    <div className="flex items-center space-x-1 text-success-600">
                      <FaLightbulb className="h-4 w-4" />
                      <span className="text-sm font-medium">{stats.suggestions} Suggestions</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Analyze Your
              <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent"> Report Quality</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Upload your TU project report and get instant professional feedback on format compliance, 
              grammar, and content structure.
            </p>
          </motion.div>

          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="glass-effect rounded-2xl p-8 mb-8 card-shadow hover-lift"
          >
            <FileUpload setResults={setResults} />
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <ResultDisplay results={results} />
          </motion.div>

          {/* Features Section */}
          {!results || results.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-16"
            >
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
                Professional Analysis Features
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/70 rounded-xl p-6 text-center hover-lift">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCheckCircle className="h-6 w-6 text-primary-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Format Compliance</h4>
                  <p className="text-gray-600 text-sm">
                    Comprehensive check against TU formatting standards and requirements
                  </p>
                </div>
                <div className="bg-white/70 rounded-xl p-6 text-center hover-lift">
                  <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaExclamationTriangle className="h-6 w-6 text-warning-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Grammar & Spelling</h4>
                  <p className="text-gray-600 text-sm">
                    Detailed grammar and spelling analysis with specific corrections
                  </p>
                </div>
                <div className="bg-white/70 rounded-xl p-6 text-center hover-lift">
                  <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaTimesCircle className="h-6 w-6 text-success-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Content Enhancement</h4>
                  <p className="text-gray-600 text-sm">
                    Suggestions for improving content structure and clarity
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 bg-white/50 backdrop-blur-md border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-gray-600">
              <p>&copy; 2024 TU Report Checker. Professional document analysis for academic excellence.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
