import React from 'react';
import { PrintHeaderConfig } from '../../types';
import { PRINT_HEADER_TEMPLATE_OPTIONS } from '../../constants';

interface PrintTemplateTabProps {
  draftConfig: PrintHeaderConfig;
  onUpdateDraft: (updater: (current: PrintHeaderConfig) => PrintHeaderConfig) => void;
}

function PrintTemplateTab({ draftConfig, onUpdateDraft }: PrintTemplateTabProps) {
  return (
    <section className="print-header-template-grid">
      {PRINT_HEADER_TEMPLATE_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`print-template-card ${draftConfig.templateId === option.id ? 'is-active' : ''}`}
          onClick={() => {
            onUpdateDraft((current) => ({
              ...current,
              templateId: option.id,
            }));
          }}
        >
          <strong>{option.title}</strong>
          <small>{option.description}</small>
        </button>
      ))}
    </section>
  );
}

export default PrintTemplateTab;
