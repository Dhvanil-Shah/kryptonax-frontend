import React, { useState, useEffect } from 'react';
import './CompanyDetails.css';
import QualityScore from './QualityScore';

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

        // Always try to parse the data, even if status is not "ok"
        let successCount = 0;

        try {
          const historyData = await historyRes.json();
          setCompanyHistory(historyData);
          successCount++;
        } catch (e) {
          console.log(`Failed to parse company history for ${ticker}`);
          setCompanyHistory(null);
        }

        try {
          const boardData = await boardRes.json();
          setBoardMembers(boardData);
          successCount++;
        } catch (e) {
          console.log(`Failed to parse board members for ${ticker}`);
          setBoardMembers(null);
        }

        try {
          const compendiumData = await compendiumRes.json();
          setCompendium(compendiumData);
          successCount++;
        } catch (e) {
          console.log(`Failed to parse compendium for ${ticker}`);
          setCompendium(null);
        }

        // Only set error if ALL requests failed
        if (successCount === 0) {
          setError("Unable to load company data. Please try again later.");
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching company details:', err);
        setError("Network error. Please check your connection and try again.");
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

        {activeTab === 'compendium' && (
          compendium ? (
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
                          <td className="quarter-label" data-label="Quarter">{quarter}</td>
                          <td data-label="Date">{data.date}</td>
                          <td data-label="Action">
                            <button 
                              className="report-link" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedReport({...data, quarter, reportType: report.name});
                              }}
                              onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedReport({...data, quarter, reportType: report.name});
                              }}
                              title="View Report"
                              type="button"
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
          ) : (
            <div className="no-data-message">
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#787b86' }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
                <h3 style={{ color: '#d1d4dc', marginBottom: '10px' }}>Compendium Not Available</h3>
                <p>No financial reports available for {ticker}. This information may not be available for this ticker.</p>
              </div>
            </div>
          )
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
                <p className="report-description">
                  {selectedReport.reportType === "Credit Summary" 
                    ? "Detailed credit analysis including financial metrics, debt ratios, creditworthiness assessment, and risk analysis for the selected period."
                    : selectedReport.reportType === "Equity Note"
                    ? "Comprehensive equity valuation analysis, stock performance metrics, dividend information, and investment recommendations for the period."
                    : selectedReport.reportType === "ESG Compendium"
                    ? "Environmental, Social, and Governance performance report covering sustainability initiatives, corporate responsibility, and ESG score analysis."
                    : selectedReport.reportType === "Results Compendium"
                    ? "Complete financial results including revenue, earnings, profitability metrics, cash flow analysis, and year-over-year performance comparison."
                    : selectedReport.reportType === "Annual General Meeting"
                    ? "Annual general meeting report including proxy statement, shareholder resolutions, board elections, and executive compensation details."
                    : "Financial report and analysis for the selected period."}
                </p>
                {selectedReport.available && selectedReport.url ? (
                  <a href={selectedReport.url} target="_blank" rel="noopener noreferrer" className="download-btn">
                    📥 Open Report ({selectedReport.source})
                  </a>
                ) : (
                  <button className="download-btn" disabled>
                    📥 Download Report (Coming Soon)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {error && !companyHistory && !boardMembers && !compendium && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>

      {/* Quality Score Section - Completely Separate Block */}
      <div style={{ 
        marginTop: '50px',
        padding: '30px',
        backgroundColor: '#1e222d',
        borderRadius: '15px',
        border: '2px solid #2962ff',
        boxShadow: '0 4px 20px rgba(41, 98, 255, 0.2)'
      }}>
        <QualityScore ticker={ticker} apiBaseUrl={apiBaseUrl} />
      </div>
    </div>
  );
};

export default CompanyDetails;
