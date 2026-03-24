// src/components/StudentCard.tsx
import React, { useState } from 'react';
import { PHOTO_CONFIG } from '../../../config/constants';

interface StudentCardProps {
  mssv: string;
  name?: string;
  photoUrl?: string;
}

/**
 * Component hiển thị thẻ sinh viên với ảnh và thông tin
 * Dùng photoUrl từ API (đã có chữ ký), không tự ghép URL.
 */
function StudentCard({ mssv, name, photoUrl }: StudentCardProps) {
  const [imageError, setImageError] = useState(false);
  const effectiveSrc = !imageError && photoUrl ? photoUrl : PHOTO_CONFIG.PLACEHOLDER_URL;

  return (
    <div className="card student-card">
      <img
        src={effectiveSrc}
        className="card-img-top"
        alt={`Ảnh của sinh viên ${mssv}`}
        onError={() => setImageError(true)}
      />
      <div className="card-body">
        <h6 className="card-title">{mssv}</h6>
        {name && <span className="student-name">{name}</span>}
      </div>
    </div>
  );
}

export default StudentCard;
