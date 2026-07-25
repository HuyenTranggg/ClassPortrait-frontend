import React from 'react';

export interface ScannedStudent {
  studentId: string;
  mssv: string;
  fullName: string;
  photoUrl: string;
  scannedAt: Date;
  matchScore?: number;
  method?: 'ai' | 'manual';
}

interface RecentScansLogProps {
  scans: ScannedStudent[];
  onUndo: (studentId: string) => void;
}

export const RecentScansLog: React.FC<RecentScansLogProps> = ({ scans, onUndo }) => {
  return (
    <div className="recent-scans-log mt-3" style={{ height: '90px' }}>
      <h6 className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>Đã quét gần đây</h6>
      <div className="d-flex gap-2 overflow-x-auto overflow-y-hidden py-1 align-items-center" style={{ maxWidth: '100%', height: '62px' }}>
        {scans.length === 0 ? (
          <div className="text-muted w-100 h-100 d-flex align-items-center" style={{ fontSize: '0.85rem' }}>
            Chưa có lượt quét nào
          </div>
        ) : (
          scans.map((scan) => (
            <div key={`${scan.studentId}-${scan.scannedAt.getTime()}`} className="card shadow-sm border-0 flex-shrink-0" style={{ width: '200px' }}>
              <div className="card-body p-2 d-flex align-items-center gap-2">
                <img
                  src={scan.photoUrl}
                  alt={scan.fullName}
                  className="rounded-circle"
                  style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="%236c757d"/><text x="20" y="25" text-anchor="middle" fill="%23fff" font-size="10">${scan.mssv}</text></svg>`;
                  }}
                />
                <div className="flex-grow-1 overflow-hidden">
                  <div className="text-truncate fw-bold" style={{ fontSize: '0.85rem' }} title={scan.fullName}>{scan.fullName}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {scan.method === 'manual' || scan.matchScore === undefined
                      ? 'Thủ công'
                      : `${scan.matchScore}%`} - {scan.scannedAt.toLocaleTimeString()}
                  </div>
                </div>
                <button 
                  className="btn btn-sm btn-outline-danger p-1" 
                  onClick={() => onUndo(scan.studentId)}
                  title="Hoàn tác điểm danh"
                >
                  <i className="bi bi-arrow-counterclockwise"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
