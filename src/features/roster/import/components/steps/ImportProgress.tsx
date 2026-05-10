import React from 'react';

/**
 * Component hiển thị thanh tiến trình (stepper) của quá trình import.
 * 
 * @param step Bước hiện tại đang được hiển thị (từ 1 đến 5).
 * @returns React Element chứa giao diện thanh tiến trình.
 */
export const ImportProgress = ({ step }: { step: 1 | 2 | 3 | 4 | 5 }) => (
  <div className="import-stepper">
    <div className={`import-step ${step >= 1 ? 'is-active' : ''}`}>
      <span className="step-dot">{step > 1 ? '✓' : '1'}</span>
      <span>Chọn nguồn</span>
    </div>
    <div className="step-line" />
    <div className={`import-step ${step >= 2 ? 'is-active' : ''}`}>
      <span className="step-dot">{step > 3 ? '✓' : '2'}</span>
      <span>Xác nhận cột</span>
    </div>
    <div className="step-line" />
    <div className={`import-step ${step >= 4 ? 'is-active' : ''}`}>
      <span className="step-dot">{step === 3 && step > 4 ? '✓' : '3'}</span>
      <span>Preview</span>
    </div>
    <div className="step-line" />
    <div className={`import-step ${step >= 5 ? 'is-active' : ''}`}>
      <span className="step-dot">4</span>
      <span>Hoàn tất</span>
    </div>
  </div>
);
