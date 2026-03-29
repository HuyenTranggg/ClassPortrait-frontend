import React from 'react';
import { ImportHistoryItem } from '../../services/classService';
import { classFieldLabel, studentChangeLabel } from './constants';

interface ChangesSummaryProps {
  item: ImportHistoryItem;
}

function ChangesSummary({ item }: ChangesSummaryProps) {
  const summary = item.changesSummary;

  if (!summary) {
    return <span className="text-muted">-</span>;
  }

  const classFieldChanges = Array.isArray(summary.classFieldChanges) ? summary.classFieldChanges : [];
  const studentChanges = summary.studentChanges && typeof summary.studentChanges === 'object'
    ? Object.entries(summary.studentChanges).filter(([, value]) => typeof value === 'number')
    : [];

  if (classFieldChanges.length === 0 && studentChanges.length === 0) {
    return <span className="text-muted">Không có thay đổi chi tiết</span>;
  }

  return (
    <div className="history-change-summary">
      {classFieldChanges.length > 0 && (
        <div className="history-change-group">
          <strong>Lớp:</strong>
          {classFieldChanges.map((change) => {
            const field = classFieldLabel[change.field] || change.field;
            const oldValue = String(change.oldValue ?? '(trống)');
            const newValue = String(change.newValue ?? '(trống)');

            return (
              <div key={`${change.field}-${oldValue}-${newValue}`} className="history-change-line">
                {field}: {oldValue} {'->'} {newValue}
              </div>
            );
          })}
        </div>
      )}

      {studentChanges.length > 0 && (
        <div className="history-change-group">
          <strong>Sinh viên:</strong>
          {studentChanges.map(([key, value]) => (
            <div key={key} className="history-change-line">
              {studentChangeLabel[key] || key}: {value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChangesSummary;
