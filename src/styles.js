export const OPTESIS_FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  * { font-family: 'Poppins', 'Segoe UI', system-ui, sans-serif !important; }
  body { background: #FDFAF6; margin: 0; }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #F5F0FA; }
  ::-webkit-scrollbar-thumb { background: #C9B8DC; border-radius: 3px; }

  .sidebar-overlay { display: none !important; }
  @media (max-width: 768px) {
    .sidebar-overlay-active { display: block !important; }
  }

  .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 640px) {
    .dash-grid { grid-template-columns: 1fr !important; }
    .dash-grid .card-full, .dash-grid .card-half { grid-column: 1 / -1 !important; }
  }

  .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  @media (max-width: 560px) {
    .form-grid-2 { grid-template-columns: 1fr !important; }
  }

  .insp-header-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  @media (max-width: 480px) {
    .insp-header-grid { grid-template-columns: 1fr !important; }
  }

  .filters-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; margin-bottom: 12px; }
  .filter-item { display: flex; flex-direction: column; gap: 3px; min-width: 140px; }
  @media (max-width: 500px) {
    .filter-item { min-width: 100%; }
  }

  .card-header-subtitle { font-size: 9px; color: #9F8EAE; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .perm-matrix { overflow-x: auto; }
  .perm-matrix table { min-width: 420px; }

  .tab-content { padding: 14px; }
  @media (max-width: 480px) {
    .tab-content { padding: 10px 8px; }
  }

  @media (max-width: 420px) {
    .login-card { padding: 20px 16px !important; }
    .login-title { font-size: 22px !important; }
  }

  .sidebar-wrapper {
    width: 220px; flex-shrink: 0; background: #5F3876;
    display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; height: 100dvh;
    z-index: 50; overflow: hidden;
    transition: width 0.25s cubic-bezier(.4,0,.2,1);
  }
  .sidebar-wrapper.closed { width: 0; box-shadow: none; }
  .sidebar-wrapper.open   { box-shadow: 4px 0 24px rgba(95,56,118,0.25); }

  .main-content {
    flex: 1; min-width: 0; display: flex; flex-direction: column;
    transition: margin-left 0.25s cubic-bezier(.4,0,.2,1);
  }
  .main-content.sidebar-open   { margin-left: 220px; }
  .main-content.sidebar-closed { margin-left: 0; }

  @media (max-width: 768px) {
    .main-content.sidebar-open   { margin-left: 0; }
    .main-content.sidebar-closed { margin-left: 0; }
  }

  .kpi-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  @media (max-width: 600px) {
    .kpi-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 360px) {
    .kpi-grid-4 { grid-template-columns: 1fr !important; }
  }

  .sites-insp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  @media (max-width: 480px) {
    .sites-insp-grid { grid-template-columns: 1fr !important; }
  }

  .hist-row { display: grid; grid-template-columns: 10px 1fr 90px 80px 60px; gap: 6px 10px; align-items: center; }
  @media (max-width: 480px) {
    .hist-row { grid-template-columns: 8px 1fr 60px 56px !important; }
    .hist-author { display: none !important; }
  }

  .modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.45); z-index:200;
    display:flex; align-items:flex-start; justify-content:center; padding:20px 12px;
    overflow-y:auto; backdrop-filter:blur(2px); }
  .modal-box { background:white; border-radius:16px; width:100%; max-width:560px;
    box-shadow:0 24px 64px rgba(95,56,118,0.22); margin:auto; }

  @media (max-width: 480px) {
    .subtab-label { display: none; }
  }
  div::-webkit-scrollbar { display: none; }

  .resize-handle { cursor: s-resize; position: absolute; bottom: 0; right: 0; width: 24px; height: 24px;
    display: flex; align-items: flex-end; justify-content: flex-end; padding: 5px; z-index: 5; }
`;
