# TU Project Report Checker - System Architecture

## System Overview
This is a comprehensive system for analyzing and checking TU (Tribhuvan University) project reports using AI-powered analysis.

## Simple Block Diagram

```mermaid
graph TD
    %% User Interface
    A[User Interface] 
    B[Admin Dashboard]
    C[Mobile App]
    
    %% Frontend
    D[Next.js Frontend]
    E[React Components]
    F[TypeScript]
    G[Tailwind CSS]
    
    %% Backend
    H[FastAPI Backend]
    I[Python Services]
    J[PDF Processor]
    K[AI Engine]
    
    %% Database
    L[PostgreSQL Database]
    M[User Data]
    N[Analysis Results]
    O[System Config]
    
    %% AI & External
    P[Ollama AI Model]
    Q[Email Service]
    R[File Storage]
    
    %% Connections
    A --> D
    B --> D
    C --> D
    
    D --> E
    E --> F
    F --> G
    
    D --> H
    H --> I
    I --> J
    I --> K
    
    H --> L
    L --> M
    L --> N
    L --> O
    
    K --> P
    I --> Q
    I --> R
    
    J --> K
    K --> N
    
    %% Styling
    classDef user fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    classDef frontend fill:#e8f5e8,stroke:#388e3c,stroke-width:3px
    classDef backend fill:#fff3e0,stroke:#f57c00,stroke-width:3px
    classDef database fill:#fce4ec,stroke:#c2185b,stroke-width:3px
    classDef ai fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px
    classDef service fill:#e0f2f1,stroke:#00796b,stroke-width:3px
    
    class A,B,C user
    class D,E,F,G frontend
    class H,I,J,K backend
    class L,M,N,O database
    class P ai
    class Q,R service
```

## PDF Processing Flow - Block Diagram Style

```mermaid
graph TD
    %% Input Stage
    INPUT[PDF Document Upload] --> VALIDATE{PDF Validation}
    VALIDATE -->|Invalid| ERROR[Error Message]
    ERROR --> INPUT
    
    %% Text Extraction Stage
    VALIDATE -->|Valid| EXTRACT[PDF to Text Extraction]
    EXTRACT --> PAGES[Split into Pages]
    PAGES --> CLEAN[Clean & Format Text]
    
    %% AI Processing Stage
    CLEAN --> OLLAMA[Ollama AI Model]
    OLLAMA --> RULES[TU Formatting Rules Check]
    RULES --> QUALITY[Quality Assessment]
    
    %% Results Generation Stage
    QUALITY --> SUGGESTIONS[Generate Suggestions]
    QUALITY --> WARNINGS[Generate Warnings]
    QUALITY --> ERRORS[Generate Errors]
    
    %% Output Stage
    SUGGESTIONS --> FORMAT[Format Results]
    WARNINGS --> FORMAT
    ERRORS --> FORMAT
    FORMAT --> STORE[Store in Database]
    
    %% User Interface
    STORE --> DISPLAY[Display Results in Frontend]
    DISPLAY --> ACTIONS{User Actions}
    
    %% User Options
    ACTIONS -->|New Analysis| INPUT
    ACTIONS -->|Save Results| ARCHIVE[Archive Results]
    ACTIONS -->|Download| DOWNLOAD[Download Report]
    ACTIONS -->|Share| SHARE[Share Results]
    
    %% Archive & Retrieval
    ARCHIVE --> RETRIEVE[Store in Archive Table]
    RETRIEVE --> DISPLAY
    DOWNLOAD --> DISPLAY
    SHARE --> DISPLAY
    
    %% Styling
    classDef input fill:#e8f5e8,stroke:#388e3c,stroke-width:3px
    classDef process fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    classDef decision fill:#fff3e0,stroke:#f57c00,stroke-width:3px
    classDef ai fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef output fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef error fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef storage fill:#e0f2f1,stroke:#00796b,stroke-width:2px
    
    class INPUT input
    class EXTRACT,PAGES,CLEAN,FORMAT,DISPLAY,ACTIONS,ARCHIVE,DOWNLOAD,SHARE process
    class VALIDATE,ACTIONS decision
    class OLLAMA,RULES,QUALITY ai
    class SUGGESTIONS,WARNINGS,ERRORS output
    class ERROR error
    class STORE,RETRIEVE storage
```

## Alternative Text-Based Block Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    INPUT STAGE                                 │
├─────────────────┬─────────────────┬───────────────────────────┤
│  PDF Upload     │  File Validation│   Server Storage          │
└─────────┬───────┴─────────┬───────┴─────────────┬─────────────┘
          │                 │                     │
          ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PROCESSING STAGE                              │
├─────────────────┬─────────────────┬───────────────────────────┤
│  Text Extract   │  Page Splitting │   Text Cleaning           │
├─────────────────┼─────────────────┼───────────────────────────┤
│  Structure Analysis│ Content ID   │   Format Preparation      │
└─────────────────┴─────────────────┴───────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI ANALYSIS STAGE                           │
├─────────────────┬─────────────────┬───────────────────────────┤
│  Ollama AI      │  TU Rules Check │   Quality Assessment      │
├─────────────────┼─────────────────┼───────────────────────────┤
│  Issue Detection│  Suggestion Gen │   Error Identification     │
└─────────────────┴─────────────────┴───────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OUTPUT STAGE                                │
├─────────────────┬─────────────────┬───────────────────────────┤
│  Result Format  │  Database Store │   Frontend Display        │
├─────────────────┼─────────────────┼───────────────────────────┤
│  User Actions   │  Archive Save   │   Download/Share          │
└─────────────────┴─────────────────┴───────────────────────────┘
```

## Detailed PDF Processing Steps

### **📤 Phase 1: PDF Upload & Validation**
```
User Interface → File Upload Component → File Validation → Server Storage
```
1. **File Selection**: User drags & drops or selects PDF file
2. **Frontend Validation**: Check file type, size, and format
3. **Backend Validation**: Server-side security checks
4. **File Storage**: Save PDF to secure server location

### **🔍 Phase 2: Text Extraction & Processing**
```
PDF File → Text Extraction Service → Page Splitting → Text Cleaning
```
1. **PDF Reading**: Use PyPDF2 or similar library to read PDF
2. **Page Extraction**: Extract text from each page individually
3. **Text Cleaning**: Remove formatting artifacts, normalize spacing
4. **Structure Analysis**: Identify headers, sections, and content types

### **🤖 Phase 3: AI Analysis & Processing**
```
Cleaned Text → Ollama AI Model → TU Rules Check → Quality Assessment
```
1. **Content Preparation**: Format text for AI model input
2. **AI Processing**: Send to Ollama local LLM
3. **Rules Checking**: Compare against TU formatting standards
4. **Issue Detection**: Identify problems and areas for improvement
5. **Suggestion Generation**: Create actionable recommendations

### **📊 Phase 4: Results Generation & Categorization**
```
AI Analysis → Result Categorization → Formatting → Database Storage
```
1. **Result Categorization**: Sort into Suggestions, Warnings, Errors
2. **Data Formatting**: Structure results for user display
3. **Database Storage**: Save analysis results with metadata
4. **User Interface**: Display results in organized categories

### **💾 Phase 5: User Experience & Actions**
```
Results Display → User Actions → Archive/Download/Share → Dashboard
```
1. **Results Display**: Show categorized analysis results
2. **User Actions**: Allow saving, downloading, or sharing
3. **Archive Storage**: Store results for future reference
4. **Return to Dashboard**: Ready for next analysis

## PDF Processing Technical Details

### **🔧 Backend Services Used**
- **PDF Reader**: `PyPDF2` or `pdfplumber` for text extraction
- **Text Processing**: `re` (regex) for text cleaning
- **AI Integration**: Custom Ollama client for analysis
- **Database**: PostgreSQL with SQLAlchemy ORM
- **File Storage**: Local server storage with cleanup

### **⚡ Processing Performance**
- **Text Extraction**: ~2-5 seconds per page
- **AI Analysis**: ~10-30 seconds depending on content length
- **Total Processing**: ~1-3 minutes for typical reports
- **Real-time Updates**: Progress indicators during processing

### **🛡️ Security & Validation**
- **File Type Check**: Only PDF files accepted
- **Size Limits**: Maximum file size restrictions
- **Virus Scanning**: Basic malware protection
- **Content Validation**: Check for readable text content
- **User Authentication**: Secure access to uploaded files

### **📱 User Experience Features**
- **Progress Bar**: Real-time processing status
- **Error Handling**: Clear error messages for invalid files
- **Result Preview**: Quick overview before detailed analysis
- **Download Options**: PDF reports with analysis results
- **Archive Access**: Retrieve previous analysis results

## Alternative Text-Based PDF Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PDF UPLOAD PHASE                            │
├─────────────────┬─────────────────┬───────────────────────────┤
│  File Selection │  Drag & Drop    │   Browse Files            │
├─────────────────┼─────────────────┼───────────────────────────┤
│  File Validation│  Size Check     │   Type Verification       │
└─────────────────┴─────────────────┴───────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  TEXT EXTRACTION PHASE                         │
├─────────────────┬─────────────────┬───────────────────────────┤
│   PDF Reading   │  Page Splitting │   Text Extraction         │
├─────────────────┼─────────────────┼───────────────────────────┤
│  Text Cleaning  │  Structure Analysis│ Content Identification │
└─────────────────┴─────────────────┴───────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI ANALYSIS PHASE                           │
├─────────────────┬─────────────────┬───────────────────────────┤
│  Content Prep   │  Ollama AI      │   TU Rules Check          │
├─────────────────┼─────────────────┼───────────────────────────┤
│ Quality Assessment│ Issue Detection│ Suggestion Generation     │
└─────────────────┴─────────────────┴───────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  RESULTS GENERATION                            │
├─────────────────┬─────────────────┬───────────────────────────┤
│  Categorization │  Data Formatting│   Database Storage        │
├─────────────────┼─────────────────┼───────────────────────────┤
│  User Display   │  Action Options │   Archive Management      │
└─────────────────┴─────────────────┴───────────────────────────┘
```

This detailed flow shows exactly how your PDF moves through the system, from the moment it's uploaded until the user receives their analysis results!
