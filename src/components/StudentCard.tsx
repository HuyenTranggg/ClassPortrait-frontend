// src/components/StudentCard.tsx
import React, { useState } from 'react';
import { studentService } from '../services';
import { PHOTO_CONFIG } from '../config/constants';

interface StudentCardProps {
  mssv: string;
  name?: string;
}

/**
 * Component hiển thị thẻ sinh viên với ảnh và thông tin
 */
function StudentCard({ mssv, name }: StudentCardProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = studentService.getPhotoUrl(mssv);

  return (
    <div className="card student-card">
      <img 
        src={imageError ? PHOTO_CONFIG.PLACEHOLDER_URL : imageUrl}
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
