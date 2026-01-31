import React, { useState, useEffect } from 'react';
import './CompanyDetails.css';

const CompanyDetails = ({ ticker, apiBaseUrl }) => {
  const [activeTab, setActiveTab] = useState('history');
  const [companyHistory, setCompanyHistory] = useState(null);
  const [boardMembers, setBoardMembers] = useState(null);
  const [compendium, setCompendium] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setSelectedReport(null); // Clear any previous report selection

        const [historyRes, boardRes, compendiumRes] = await Promise.all([
          fetch(`${apiBaseUrl}/company-history/${ticker}`),
          fetch(`${apiBaseUrl}/board-members/${ticker}`),
          fetch(`${apiBaseUrl}/compendium/${ticker}`)
        ]);

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setCompanyHistory(historyData);
        }

        if (boardRes.ok) {
          const boardData = await boardRes.json();
          setBoardMembers(boardData);
        }

        if (compendiumRes.ok) {
          const compendiumData = await compendiumRes.json();
          setCompendium(compendiumData);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (ticker) {
      fetchCompanyDetails();
    }
  }, [ticker, apiBaseUrl]);

  if (loading) {
    return (
      <div className="company-details-container">
        <div className="loading-spinner">Loading company details...</div>
      </div>
    );
  }

  return (
    <div className="company-details-container">
      <div className="company-details-tabs">
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Company History
        </button>
        <button
          className={`tab-btn ${activeTab === 'board' ? 'active' : ''}`}
          onClick={() => setActiveTab('board')}
        >
          Board Members
        </button>
        <button
          className={`tab-btn ${activeTab === 'compendium' ? 'active' : ''}`}
          onClick={() => setActiveTab('compendium')}
        >
          Compendium
        </button>
      </div>

      <div className="company-details-content">
        {activeTab === 'history' && companyHistory && (
          <div className="history-section">
            <h2>{companyHistory.company_name}</h2>
            <div className="history-grid">
              <div className="history-item">
                <span className="label">Sector</span>
                <span className="value">{companyHistory.sector}</span>
              </div>
              <div className="history-item">
                <span className="label">Industry</span>
                <span className="value">{companyHistory.industry}</span>
              </div>
              <div className="history-item">
                <span className="label">Founded</span>
                <span className="value">{companyHistory.founded}</span>
              </div>
              <div className="history-item">
                <span className="label">Country</span>
                <span className="value">{companyHistory.country}</span>
              </div>
              <div className="history-item">
                <span className="label">Employees</span>
                <span className="value">
                  {typeof companyHistory.employees === 'number'
                    ? (companyHistory.employees / 1000).toFixed(1) + 'K'
                    : companyHistory.employees}
                </span>
              </div>
              <div className="history-item">
                <span className="label">Market Cap</span>
                <span className="value">
                  {typeof companyHistory.market_cap === 'number'
                    ? '$' + (companyHistory.market_cap / 1e9).toFixed(2) + 'B'
                    : companyHistory.market_cap}
                </span>
              </div>
            </div>
            <div className="description-section">
              <h3>About</h3>
              <p>{companyHistory.description}</p>
            </div>
          </div>
        )}

        {activeTab === 'board' && boardMembers && (
          <div className="board-section">
            <h2>Board Members & Leadership</h2>
            <p className="board-count">{boardMembers.board_size} members</p>
            
            {/* Leadership Section - Owner and Chairperson */}
            {boardMembers.leadership && boardMembers.leadership.length > 0 && (
              <div className="leadership-section">
                <h3>Leadership</h3>
                <div className="leadership-grid">
                  {boardMembers.leadership.map((member, idx) => (
                    <div key={`leadership-${idx}`} className="leadership-card">
                      <div className="leadership-badge">{member.role}</div>
                      <img src={member.photo_url} alt={member.name} className="member-photo-large" />
                      <h4 className="member-name-large">{member.name}</h4>
                      <p className="member-title-large">{member.title}</p>
                      {member.pay > 0 && (
                        <p className="member-pay-large">
                          ${(member.pay / 1e6).toFixed(2)}M
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Board Members Grid */}
            {boardMembers.board_members && boardMembers.board_members.length > 0 && (
              <div className="board-members-section">
                <h3>Board Members</h3>
                <div className="board-grid">
                  {boardMembers.board_members.map((member, idx) => (
                    <div key={`board-${idx}`} className="board-member-card">
                      <img src={member.photo_url} alt={member.name} className="member-photo" />
                      <h4 className="member-name">{member.name}</h4>
                      <p className="member-title">{member.title}</p>
                      {member.pay > 0 && (
                        <p className="member-pay">
                          ${(member.pay / 1e6).toFixed(2)}M
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'compendium' && compendium && (
          <div className="compendium-section">
            <h2>Financial Compendium & Reports</h2>
            <div className="compendium-tabs">
              {Object.entries(compendium.reports).map(([key, report]) => (
                <div key={key} className="compendium-report">
                  <h3 className="report-name">{report.name}</h3>
                  <p className="report-desc">{report.description}</p>
                  <table className="quarters-table">
                    <thead>
                      <tr>
                        <th>Quarter</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(report.quarters).map(([quarter, data]) => (
                        <tr key={quarter}>
                          <td className="quarter-label">{quarter}</td>
                          <td>{data.date}</td>
                          <td>
                            <button 
                              className="report-link" 
                              onClick={() => setSelectedReport({...data, quarter, reportType: report.name})}
                              title="View Report"
                            >
                              📄 View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedReport && (
          <div className="report-modal-overlay" onClick={() => setSelectedReport(null)}>
            <div className="report-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedReport(null)}>✕</button>
              <div className="report-modal-content">
                <h3 className="report-modal-title">{selectedReport.reportType}</h3>
                <div className="report-meta">
                  <span className="report-quarter">{selectedReport.quarter}</span>
                  <span className="report-date">{selectedReport.date}</span>
                </div>
                <div className="report-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="11" x2="12" y2="17"></line>
                    <line x1="9" y1="14" x2="15" y2="14"></line>
                  </svg>
                  <p>Report Document</p>
                  <span className="report-status">Available for Download</span>
                </div>
                <p className="report-description">
                  This comprehensive financial report contains detailed analysis, metrics, and insights for the selected period.
                </p>
                <button className="download-btn" disabled>
                  📥 Download Report (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            Error loading company details: {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDetails;
