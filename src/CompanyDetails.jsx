import React, { useState, useEffect } from 'react';
import './CompanyDetails.css';

const CompanyDetails = ({ ticker, apiBaseUrl }) => {
  const [activeTab, setActiveTab] = useState('history');
  const [companyHistory, setCompanyHistory] = useState(null);
  const [boardMembers, setBoardMembers] = useState(null);
  const [compendium, setCompendium] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        setLoading(true);
        setError(null);

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
            {companyHistory.website && companyHistory.website !== 'N/A' && (
              <div className="website-section">
                <a href={companyHistory.website} target="_blank" rel="noopener noreferrer" className="website-link">
                  Visit Website →
                </a>
              </div>
            )}
          </div>
        )}

        {activeTab === 'board' && boardMembers && (
          <div className="board-section">
            <h2>Board Members & Leadership</h2>
            <p className="board-count">{boardMembers.board_size} members</p>
            <div className="board-grid">
              {boardMembers.board_members.map((member, idx) => (
                <div key={idx} className="board-member-card">
                  <img src={member.photo_url} alt={member.name} className="member-photo" />
                  <h3 className="member-name">{member.name}</h3>
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
                            <a href={data.url} className="report-link" title="Download Report">
                              📄 View
                            </a>
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
