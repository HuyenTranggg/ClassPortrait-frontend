import React, { useRef } from 'react';
import { StepFour, StepOne, StepThree, StepTwo } from './import-button/ImportButtonSteps';
import { useImportButtonController } from './import-button/useImportButtonController';
import { ImportButtonProps } from './import-button/types';

function ImportButton({ onImportSuccess }: ImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, actions] = useImportButtonController({ onImportSuccess });

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="import-container">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (file) {
            await actions.parseAndMoveToConfirmStep(file);
          }
        }}
        style={{ display: 'none' }}
      />

      <button className="btn btn-success btn-sm" onClick={() => actions.openModal(resetFileInput)} disabled={state.isParsing || state.isImporting}>
        {state.isImporting ? (
          <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang import...</>
        ) : (
          <><i className="bi bi-upload me-1"></i>Import File</>
        )}
      </button>

      {state.isOpen && (
        <div className="import-modal-backdrop" role="presentation" onClick={state.isImporting ? undefined : () => actions.closeModal(resetFileInput)}>
          <div className="import-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => actions.closeModal(resetFileInput)} disabled={state.isImporting} aria-label="Đóng">×</button>
            <h2>Import danh sách thí sinh</h2>

            {state.step === 1 && (
              <StepOne
                state={state}
                onSelectSource={actions.setSelectedSource}
                onOpenFilePicker={() => fileInputRef.current?.click()}
                onMoveSheetToConfirmStep={actions.moveSheetToConfirmStep}
                onGoogleSheetUrlChange={actions.setGoogleSheetUrl}
                onDragOver={() => !state.isParsing && actions.setDragOver(true)}
                onDragLeave={() => actions.setDragOver(false)}
                onDropFile={actions.parseAndMoveToConfirmStep}
              />
            )}

            {state.step === 2 && (
              <StepTwo
                state={state}
                onBack={() => actions.setStep(1)}
                onManualMode={() => {
                  actions.setStepThreeManual();
                  actions.setStep(3);
                }}
                onSubmitAuto={actions.submitAuto}
              />
            )}

            {state.step === 3 && (
              <StepThree
                state={state}
                onClose={() => actions.closeModal(resetFileInput)}
                onBack={() => actions.setStep(2)}
                onSubmitManual={actions.submitManual}
                onManualMssvChange={actions.setManualMssvColumn}
                onManualNameChange={actions.setManualNameColumn}
                onStartRowChange={actions.setStartRow}
              />
            )}

            {state.step === 4 && (
              <StepFour
                state={state}
                onCreateNew={actions.handleDuplicateCreateNew}
                onPrepareUpdate={actions.handleDuplicatePrepareUpdate}
                onBackToChoose={actions.setDuplicateStepModeChoose}
                onConfirmUpdate={actions.handleDuplicateConfirmUpdate}
              />
            )}

            {state.message && !(state.step === 3 && state.stepThreeMode === 'success') && (
              <div className={`alert ${state.message.type === 'success' ? 'alert-success' : 'alert-danger'} mt-3 mb-0`} role="alert">
                {state.message.text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImportButton;
