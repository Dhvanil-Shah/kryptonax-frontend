import React, { useState } from 'react';
import './RegionFilter.css';

const REGIONS = {
  all: { name: 'All Regions', states: [] },
  india: {
    name: 'India',
    states: ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Gujarat', 'West Bengal']
  },
  us: {
    name: 'United States',
    states: ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington']
  },
  uk: {
    name: 'United Kingdom',
    states: ['England', 'Scotland', 'Wales', 'Northern Ireland']
  },
  japan: {
    name: 'Japan',
    states: ['Tokyo', 'Osaka', 'Kyoto', 'Hokkaido', 'Fukuoka']
  },
  china: {
    name: 'China',
    states: ['Beijing', 'Shanghai', 'Guangdong', 'Zhejiang', 'Jiangsu']
  }
};

const RegionFilter = ({ selectedRegions, selectedStates, onRegionsChange, onStatesChange }) => {
  const [showStates, setShowStates] = useState({});

  const toggleRegion = (regionKey) => {
    if (regionKey === 'all') {
      // If "All" is selected, clear everything
      onRegionsChange(['all']);
      onStatesChange({});
      setShowStates({});
    } else {
      let newRegions;
      if (selectedRegions.includes('all')) {
        // If "All" was selected, replace it with the new region
        newRegions = [regionKey];
      } else if (selectedRegions.includes(regionKey)) {
        // Remove the region
        newRegions = selectedRegions.filter(r => r !== regionKey);
        // Remove associated states
        const newStates = { ...selectedStates };
        delete newStates[regionKey];
        onStatesChange(newStates);
        
        // Close state selector if open
        const newShowStates = { ...showStates };
        delete newShowStates[regionKey];
        setShowStates(newShowStates);
        
        // If no regions left, default to "all"
        if (newRegions.length === 0) {
          newRegions = ['all'];
        }
      } else {
        // Add the region
        newRegions = selectedRegions.filter(r => r !== 'all').concat(regionKey);
      }
      onRegionsChange(newRegions);
    }
  };

  const toggleState = (regionKey, stateName) => {
    const currentStates = selectedStates[regionKey] || [];
    let newStates;
    
    if (currentStates.includes(stateName)) {
      // Remove state
      newStates = currentStates.filter(s => s !== stateName);
    } else {
      // Add state
      newStates = [...currentStates, stateName];
    }
    
    onStatesChange({
      ...selectedStates,
      [regionKey]: newStates
    });
  };

  const toggleStateSelector = (regionKey) => {
    setShowStates(prev => ({
      ...prev,
      [regionKey]: !prev[regionKey]
    }));
  };

  const getStateCount = (regionKey) => {
    return selectedStates[regionKey]?.length || 0;
  };

  return (
    <div className="region-filter-container">
      <div className="region-filter-header">
        <h3>🌍 Region Filter</h3>
        <p className="filter-description">Select regions and states for customized results</p>
      </div>

      <div className="region-chips">
        {Object.entries(REGIONS).map(([key, region]) => {
          const isSelected = selectedRegions.includes(key);
          const stateCount = getStateCount(key);
          
          return (
            <div key={key} className="region-chip-wrapper">
              <div
                className={`region-chip ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleRegion(key)}
              >
                <span className="region-name">{region.name}</span>
                {stateCount > 0 && (
                  <span className="state-count">{stateCount}</span>
                )}
              </div>
              
              {/* State selector button - only show for selected regions with states */}
              {isSelected && key !== 'all' && region.states.length > 0 && (
                <button
                  className={`state-toggle-btn ${showStates[key] ? 'active' : ''}`}
                  onClick={() => toggleStateSelector(key)}
                  title="Select states"
                >
                  {showStates[key] ? '▼' : '▶'}
                </button>
              )}
              
              {/* State chips dropdown */}
              {showStates[key] && isSelected && region.states.length > 0 && (
                <div className="state-chips-dropdown">
                  <div className="state-chips-header">
                    <span>States in {region.name}</span>
                    {stateCount > 0 && (
                      <button
                        className="clear-states-btn"
                        onClick={() => onStatesChange({ ...selectedStates, [key]: [] })}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="state-chips">
                    {region.states.map(stateName => {
                      const isStateSelected = selectedStates[key]?.includes(stateName);
                      return (
                        <div
                          key={stateName}
                          className={`state-chip ${isStateSelected ? 'selected' : ''}`}
                          onClick={() => toggleState(key, stateName)}
                        >
                          {stateName}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active filters summary */}
      {selectedRegions.length > 0 && !selectedRegions.includes('all') && (
        <div className="active-filters-summary">
          <span className="summary-label">Active:</span>
          {selectedRegions.map(regionKey => {
            const stateCount = getStateCount(regionKey);
            return (
              <span key={regionKey} className="summary-tag">
                {REGIONS[regionKey].name}
                {stateCount > 0 && ` (${stateCount} states)`}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RegionFilter;
