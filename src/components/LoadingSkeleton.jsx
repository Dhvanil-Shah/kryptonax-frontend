import React from 'react';
import './LoadingSkeleton.css';

export const CompanyDetailsSkeleton = () => (
  <div className="skeleton-container">
    <div className="skeleton-header">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-subtitle"></div>
    </div>
    <div className="skeleton-grid">
      <div className="skeleton skeleton-card"></div>
      <div className="skeleton skeleton-card"></div>
      <div className="skeleton skeleton-card"></div>
      <div className="skeleton skeleton-card"></div>
    </div>
  </div>
);

export const TradingAnalysisSkeleton = () => (
  <div className="skeleton-container">
    <div className="skeleton-buttons">
      <div className="skeleton skeleton-button"></div>
      <div className="skeleton skeleton-button"></div>
      <div className="skeleton skeleton-button"></div>
      <div className="skeleton skeleton-button"></div>
      <div className="skeleton skeleton-button"></div>
      <div className="skeleton skeleton-button"></div>
    </div>
    <div className="skeleton skeleton-content"></div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="skeleton-chart">
    <div className="skeleton skeleton-chart-header"></div>
    <div className="skeleton skeleton-chart-body"></div>
  </div>
);
