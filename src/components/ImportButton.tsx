// src/components/ImportButton.tsx
import React, { useRef, useState } from 'react';
import { classService } from '../services';

interface ImportButtonProps {
  onImportSuccess: () => void;
}

/**
 * Component nút Import file sinh viên
 * Hỗ trợ file Excel (.xlsx, .xls), CSV (.csv) và JSON (.json)
 */
function ImportButton({ onImportSuccess }: ImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng file
    const validExtensions = ['.xlsx', '.xls', '.csv', '.json'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      setMessage({
        type: 'error',
        text: `File không hợp lệ. Chỉ chấp nhận: ${validExtensions.join(', ')}`
      });
      return;
    }

    setImporting(true);
    setMessage(null);

    try {
      const result = await classService.importClass(file);
      setMessage({
        type: 'success',
        text: result.message || 'Import thành công!'
      });
      
      // Gọi callback để refresh danh sách lớp học
      setTimeout(() => {
        onImportSuccess();
        setMessage(null);
      }, 2000);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Import thất bại!'
      });
    } finally {
      setImporting(false);
      // Reset input để có thể chọn lại cùng file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="import-container">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv,.json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <button
        className="btn btn-success btn-sm"
        onClick={handleButtonClick}
        disabled={importing}
      >
        {importing ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Đang import...
          </>
        ) : (
          <>
            <i className="bi bi-upload me-1"></i>
            Import File
          </>
        )}
      </button>

      {message && (
        <div 
          className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}
          role="alert"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            fontSize: '0.875rem',
            minWidth: '300px',
            maxWidth: '400px',
            margin: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {message.text}
          <button
            type="button"
            className="btn-close"
            onClick={() => setMessage(null)}
            aria-label="Close"
          ></button>
        </div>
      )}
    </div>
  );
}

export default ImportButton;
