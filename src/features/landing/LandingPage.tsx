import React from 'react';

interface LandingPageProps {
  onLoginClick: () => void;
  onFeatureClick: (feature: string) => void;
}

const quickActions = [
  { key: 'gallery', label: 'Sổ ảnh', description: 'Tạo và xem sổ ảnh theo từng lớp' },
  { key: 'history', label: 'Lịch sử import', description: 'Xem lại các đợt nhập dữ liệu' },
  { key: 'share', label: 'Chia sẻ', description: 'Chuẩn bị chia sẻ cho cán bộ phụ trách' },
  { key: 'settings', label: 'Cài đặt', description: 'Tùy chỉnh layout, in ấn và dữ liệu' },
];

function LandingPage({ onLoginClick, onFeatureClick }: LandingPageProps) {
  return (
    <div className="landing-shell">
      <aside className="landing-sidebar">
        <div className="brand-block">
          <div className="brand-mark">S</div>
          <div>
            <strong>Sổ ảnh</strong>
            <span>Thi sinh dự thi</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {quickActions.map((action) => (
            <button
              key={action.key}
              type="button"
              className={`sidebar-link ${action.key === 'gallery' ? 'is-active' : ''}`}
              onClick={() => onFeatureClick(action.label)}
            >
              <span>{action.label}</span>
              <small>{action.description}</small>
            </button>
          ))}
        </nav>

      </aside>

      <main className="landing-main">
        <header className="landing-topbar">
          <span>Sổ ảnh thí sinh dự thi</span>
          <button type="button" className="btn btn-primary btn-login-top" onClick={onLoginClick}>
            Đăng nhập
          </button>
        </header>

        <section className="landing-hero">
          <div className="hero-copy">
            <h1>Sổ ảnh thí sinh dự thi</h1>
            <p className="hero-description">
              Import danh sách, tự động lấy ảnh theo MSSV và tạo sổ ảnh thân thiện để kiểm tra, in ấn và chia sẻ nhanh.
            </p>

            <div className="hero-actions">
              <button type="button" className="btn btn-primary btn-hero" onClick={onLoginClick}>
                Đăng nhập để bắt đầu
              </button>
            </div>
          </div>
          
        </section>
      </main>
    </div>
  );
}

export default LandingPage;
