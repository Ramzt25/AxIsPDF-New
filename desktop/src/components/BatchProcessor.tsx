import React, { useState, useCallback, useRef } from 'react';

interface BatchJob {
  id: string;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

interface BatchProcessorProps {
  onProcessComplete?: (results: BatchJob[]) => void;
}

const BatchProcessor: React.FC<BatchProcessorProps> = ({ onProcessComplete }) => {
  const [files, setFiles] = useState<BatchJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState('default');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available pipelines for batch processing
  const pipelines = [
    { id: 'default', name: 'Default Processing', description: 'PDF text extraction and validation' },
    { id: 'ocr', name: 'OCR Processing', description: 'Full OCR text recognition workflow' },
    { id: 'advanced', name: 'Advanced Analysis', description: 'Complete document analysis with all features' },
    { id: 'extract-only', name: 'Extract Only', description: 'Simple text extraction without validation' }
  ];

  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    const newJobs: BatchJob[] = Array.from(selectedFiles)
      .filter(file => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'))
      .map(file => ({
        id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        fileSize: file.size,
        status: 'pending' as const,
        progress: 0
      }));

    setFiles(prev => [...prev, ...newJobs]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeFile = useCallback((jobId: string) => {
    setFiles(prev => prev.filter(job => job.id !== jobId));
  }, []);

  const clearCompleted = useCallback(() => {
    setFiles(prev => prev.filter(job => job.status !== 'completed' && job.status !== 'error'));
  }, []);

  const clearAll = useCallback(() => {
    if (!isProcessing) {
      setFiles([]);
    }
  }, [isProcessing]);

  const startBatchProcessing = useCallback(async () => {
    if (files.length === 0 || isProcessing) return;

    setIsProcessing(true);
    
    // Process each file sequentially
    for (let i = 0; i < files.length; i++) {
      const job = files[i];
      
      if (job.status !== 'pending') continue;

      // Update job status to processing
      setFiles(prev => prev.map(f => 
        f.id === job.id 
          ? { ...f, status: 'processing' as const, startTime: new Date(), progress: 0 }
          : f
      ));

      try {
        // Simulate processing with progress updates
        for (let progress = 0; progress <= 100; progress += 10) {
          setFiles(prev => prev.map(f => 
            f.id === job.id ? { ...f, progress } : f
          ));
          
          // Simulate processing time
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Simulate successful completion
        const mockResult = {
          extractedText: `Extracted text from ${job.fileName}`,
          pageCount: Math.floor(Math.random() * 10) + 1,
          confidence: 0.85 + Math.random() * 0.1,
          wordCount: Math.floor(Math.random() * 1000) + 500
        };

        setFiles(prev => prev.map(f => 
          f.id === job.id 
            ? { 
                ...f, 
                status: 'completed' as const, 
                progress: 100, 
                endTime: new Date(),
                result: mockResult
              }
            : f
        ));

      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === job.id 
            ? { 
                ...f, 
                status: 'error' as const, 
                endTime: new Date(),
                error: error instanceof Error ? error.message : 'Processing failed'
              }
            : f
        ));
      }
    }

    setIsProcessing(false);
    
    // Call completion callback if provided
    if (onProcessComplete) {
      onProcessComplete(files);
    }
  }, [files, isProcessing, onProcessComplete]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: BatchJob['status']): string => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '⚙️';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '📄';
    }
  };

  const getStatusColor = (status: BatchJob['status']): string => {
    switch (status) {
      case 'pending': return '#6c757d';
      case 'processing': return '#007acc';
      case 'completed': return '#28a745';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const processingCount = files.filter(f => f.status === 'processing').length;
  const pendingCount = files.filter(f => f.status === 'pending').length;

  return (
    <div className="batch-processor">
      <div className="processor-header">
        <h2>Batch Document Processor</h2>
        <p>Process multiple PDF documents simultaneously using automated pipelines</p>
      </div>

      {/* Pipeline Selection */}
      <div className="pipeline-selection">
        <label htmlFor="pipeline-select">Processing Pipeline:</label>
        <select 
          id="pipeline-select"
          value={selectedPipeline}
          onChange={(e) => setSelectedPipeline(e.target.value)}
          disabled={isProcessing}
        >
          {pipelines.map(pipeline => (
            <option key={pipeline.id} value={pipeline.id}>
              {pipeline.name} - {pipeline.description}
            </option>
          ))}
        </select>
      </div>

      {/* File Drop Zone */}
      <div 
        className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="drop-content">
          <div className="drop-icon">📁</div>
          <div className="drop-text">
            <p><strong>Drop PDF files here</strong> or click to browse</p>
            <p>Multiple files supported • Max 50MB per file</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>

      {/* Batch Controls */}
      {files.length > 0 && (
        <div className="batch-controls">
          <div className="batch-stats">
            <span className="stat">
              📄 {files.length} files
            </span>
            {pendingCount > 0 && (
              <span className="stat pending">
                ⏳ {pendingCount} pending
              </span>
            )}
            {processingCount > 0 && (
              <span className="stat processing">
                ⚙️ {processingCount} processing
              </span>
            )}
            {completedCount > 0 && (
              <span className="stat completed">
                ✅ {completedCount} completed
              </span>
            )}
            {errorCount > 0 && (
              <span className="stat error">
                ❌ {errorCount} failed
              </span>
            )}
          </div>

          <div className="batch-actions">
            <button
              className="btn-primary"
              onClick={startBatchProcessing}
              disabled={isProcessing || files.length === 0}
            >
              {isProcessing ? 'Processing...' : `Process ${files.length} Files`}
            </button>
            <button
              className="btn-secondary"
              onClick={clearCompleted}
              disabled={isProcessing || (completedCount === 0 && errorCount === 0)}
            >
              Clear Completed
            </button>
            <button
              className="btn-secondary"
              onClick={clearAll}
              disabled={isProcessing}
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="file-list">
          <div className="list-header">
            <h3>Processing Queue</h3>
          </div>
          <div className="list-content">
            {files.map(job => (
              <div key={job.id} className={`file-item ${job.status}`}>
                <div className="file-info">
                  <div className="file-icon">
                    {getStatusIcon(job.status)}
                  </div>
                  <div className="file-details">
                    <div className="file-name">{job.fileName}</div>
                    <div className="file-meta">
                      {formatFileSize(job.fileSize)}
                      {job.startTime && (
                        <span> • Started: {job.startTime.toLocaleTimeString()}</span>
                      )}
                      {job.endTime && job.startTime && (
                        <span> • Duration: {Math.round((job.endTime.getTime() - job.startTime.getTime()) / 1000)}s</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="file-status">
                  <div className="status-text" style={{ color: getStatusColor(job.status) }}>
                    {job.status.toUpperCase()}
                  </div>
                  
                  {job.status === 'processing' && (
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  )}

                  {job.status === 'completed' && job.result && (
                    <div className="result-summary">
                      <small>
                        {job.result.pageCount} pages • {job.result.wordCount} words • {Math.round(job.result.confidence * 100)}% confidence
                      </small>
                    </div>
                  )}

                  {job.status === 'error' && job.error && (
                    <div className="error-message">
                      <small>{job.error}</small>
                    </div>
                  )}
                </div>

                <div className="file-actions">
                  {!isProcessing && (
                    <button
                      className="remove-btn"
                      onClick={() => removeFile(job.id)}
                      title="Remove file"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .batch-processor {
          padding: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }

        .processor-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .processor-header h2 {
          margin: 0 0 10px 0;
          color: #333;
        }

        .processor-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .pipeline-selection {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .pipeline-selection label {
          font-weight: 500;
          color: #333;
          white-space: nowrap;
        }

        .pipeline-selection select {
          flex: 1;
          padding: 10px 15px;
          border: 1px solid #ddd;
          border-radius: 6px;
          background: white;
          font-size: 14px;
        }

        .drop-zone {
          border: 2px dashed #007acc;
          border-radius: 12px;
          padding: 60px 40px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          background: #f8f9ff;
          margin-bottom: 30px;
        }

        .drop-zone:hover,
        .drop-zone.drag-over {
          border-color: #005fa3;
          background: #f0f4ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,122,204,0.2);
        }

        .drop-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .drop-icon {
          font-size: 48px;
          opacity: 0.7;
        }

        .drop-text p {
          margin: 5px 0;
        }

        .drop-text p:first-child {
          font-size: 16px;
          color: #333;
        }

        .drop-text p:last-child {
          font-size: 14px;
          color: #666;
        }

        .batch-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .batch-stats {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .stat {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          background: #f8f9fa;
          color: #333;
        }

        .stat.pending {
          background: #6c757d20;
          color: #6c757d;
        }

        .stat.processing {
          background: #007acc20;
          color: #007acc;
        }

        .stat.completed {
          background: #28a74520;
          color: #28a745;
        }

        .stat.error {
          background: #dc354520;
          color: #dc3545;
        }

        .batch-actions {
          display: flex;
          gap: 10px;
        }

        .file-list {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .list-header {
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
          background: #f8f9fa;
          border-radius: 8px 8px 0 0;
        }

        .list-header h3 {
          margin: 0;
          color: #333;
        }

        .list-content {
          max-height: 400px;
          overflow-y: auto;
        }

        .file-item {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.2s;
        }

        .file-item:hover {
          background: #f8f9fa;
        }

        .file-item:last-child {
          border-bottom: none;
        }

        .file-item.processing {
          background: #f0f8ff;
        }

        .file-item.completed {
          background: #f0fff4;
        }

        .file-item.error {
          background: #fff5f5;
        }

        .file-info {
          display: flex;
          align-items: center;
          flex: 1;
          gap: 15px;
        }

        .file-icon {
          font-size: 20px;
        }

        .file-details {
          flex: 1;
        }

        .file-name {
          font-weight: 500;
          color: #333;
          margin-bottom: 4px;
        }

        .file-meta {
          font-size: 12px;
          color: #666;
        }

        .file-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 5px;
          min-width: 150px;
        }

        .status-text {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .progress-bar {
          width: 100px;
          height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #007acc;
          transition: width 0.3s;
        }

        .result-summary,
        .error-message {
          font-size: 11px;
          text-align: right;
          max-width: 150px;
        }

        .result-summary {
          color: #28a745;
        }

        .error-message {
          color: #dc3545;
        }

        .file-actions {
          margin-left: 15px;
        }

        .remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          font-size: 14px;
          opacity: 0.7;
          transition: all 0.2s;
        }

        .remove-btn:hover {
          opacity: 1;
          background: #fee;
        }

        .btn-primary {
          background: #007acc;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #005fa3;
        }

        .btn-primary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #545b62;
        }

        .btn-secondary:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default BatchProcessor;