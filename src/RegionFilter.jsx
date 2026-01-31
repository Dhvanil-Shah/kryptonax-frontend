import React, { useState, useEffect } from 'react';
import './RegionFilter.css';

const REGIONS = {
  all: { name: 'All Regions', states: [], flag: '🌍' },
  india: {
    name: 'India',
    flag: '🇮🇳',
    states: ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Gujarat', 'West Bengal', 'Uttar Pradesh', 'Rajasthan', 'Andhra Pradesh', 'Telangana']
  },
  us: {
    name: 'United States',
    flag: '🇺🇸',
    states: ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington', 'Massachusetts', 'Pennsylvania', 'Ohio', 'Georgia']
  },
  uk: {
    name: 'United Kingdom',
    flag: '🇬🇧',
    states: ['England', 'Scotland', 'Wales', 'Northern Ireland', 'London', 'Manchester']
  },
  japan: {
    name: 'Japan',
    flag: '🇯🇵',
    states: ['Tokyo', 'Osaka', 'Kyoto', 'Hokkaido', 'Fukuoka', 'Nagoya', 'Yokohama', 'Sapporo']
  },
  china: {
    name: 'China',
    flag: '🇨🇳',
    states: ['Beijing', 'Shanghai', 'Guangdong', 'Zhejiang', 'Jiangsu', 'Shenzhen', 'Chengdu', 'Hangzhou']
  },
  canada: {
    name: 'Canada',
    flag: '🇨🇦',
    states: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan']
  },
  germany: {
    name: 'Germany',
    flag: '🇩🇪',
    states: ['Bavaria', 'Berlin', 'Hamburg', 'North Rhine-Westphalia', 'Baden-Württemberg', 'Saxony']
  },
  france: {
    name: 'France',
    flag: '🇫🇷',
    states: ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Occitanie']
  }
};

const RegionFilter = ({ selectedRegions, selectedStates, onRegionsChange, onStatesChange, isCompact = false }) => {
  const [showStates, setShowStates] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = [];

    Object.entries(REGIONS).forEach(([key, region]) => {
      if (key === 'all') return;

      // Check if region matches
      if (region.name.toLowerCase().includes(query)) {
        results.push({
          type: 'region',
          key: key,
          name: region.name,
          flag: region.flag,
          isSelected: selectedRegions.includes(key)
        });
      }

      // Check if any state matches
      region.states.forEach(state => {
        if (state.toLowerCase().includes(query)) {
          results.push({
            type: 'state',
            regionKey: key,
            regionName: region.name,
            stateName: state,
            flag: region.flag,
            isSelected: selectedStates[key]?.includes(state)
          });
        }
      });
    });

    setSearchResults(results.slice(0, 10)); // Limit to 10 results
  }, [searchQuery, selectedRegions, selectedStates]);

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
    // Ensure the region is selected first
    if (!selectedRegions.includes(regionKey)) {
      toggleRegion(regionKey);
    }

    const currentStates = selectedStates[regionKey] || [];
    let newStates;
    
    if (currentStates.includes(stateName)) {
      newStates = currentStates.filter(s => s !== stateName);
    } else {
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

  const handleSearchSelect = (result) => {
    if (result.type === 'region') {
      toggleRegion(result.key);
    } else {
      toggleState(result.regionKey, result.stateName);
    }
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

  const getActiveFilterMessage = () => {
    if (selectedRegions.includes('all')) {
      return '🌍 Showing results from all regions';
    }

    const regionNames = selectedRegions
      .map(key => REGIONS[key]?.name)
      .filter(Boolean);

    const stateDetails = Object.entries(selectedStates)
      .filter(([_, states]) => states && states.length > 0)
      .map(([regionKey, states]) => `${REGIONS[regionKey]?.name}: ${states.join(', ')}`)
      .join(' • ');

    if (stateDetails) {
      return `📍 Filtering by: ${stateDetails}`;
    }

    return `🌍 Filtering by: ${regionNames.join(', ')}`;
  };

  if (isCompact) {
    return (
      <div className="region-filter-compact">
        <div className="active-filter-banner">
          <span className="filter-icon">🔍</span>
          <span className="filter-message">{getActiveFilterMessage()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="region-filter-container">
      <div className="region-filter-header">
        <h3>🌍 Customize Your Feed</h3>
        <p className="filter-description">Filter top movers and trending news by region and state</p>
      </div>

      {/* Search Box */}
      <div className="region-search-wrapper">
        <div className="region-search-box">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search regions or states..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
            className="region-search-input"
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {showSearchDropdown && searchResults.length > 0 && (
          <div className="search-dropdown">
            {searchResults.map((result, idx) => (
              <div
                key={idx}
                className={`search-result-item ${result.isSelected ? 'selected' : ''}`}
                onClick={() => handleSearchSelect(result)}
              >
                <span className="result-flag">{result.flag}</span>
                {result.type === 'region' ? (
                  <div className="result-content">
                    <span className="result-name">{result.name}</span>
                    <span className="result-type">Region</span>
                  </div>
                ) : (
                  <div className="result-content">
                    <span className="result-name">{result.stateName}</span>
                    <span className="result-type">{result.regionName}</span>
                  </div>
                )}
                {result.isSelected && <span className="result-check">✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Select Chips */}
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
                <span className="region-flag">{region.flag}</span>
                <span className="region-name">{region.name}</span>
                {stateCount > 0 && (
                  <span className="state-count">{stateCount}</span>
                )}
              </div>
              
              {isSelected && key !== 'all' && region.states.length > 0 && (
                <button
                  className={`state-toggle-btn ${showStates[key] ? 'active' : ''}`}
                  onClick={() => toggleStateSelector(key)}
                  title="Select states"
                >
                  {showStates[key] ? '▼' : '▶'}
                </button>
              )}
              
              {showStates[key] && isSelected && region.states.length > 0 && (
                <div className="state-chips-dropdown">
                  <div className="state-chips-header">
                    <span>States/Provinces in {region.name}</span>
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
                          {isStateSelected && <span className="state-check">✓</span>}
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

      {/* Active Filters Message */}
      {!selectedRegions.includes('all') && (
        <div className="active-filter-message">
          <div className="filter-message-content">
            <span className="filter-icon">📌</span>
            <span className="filter-text">{getActiveFilterMessage()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionFilter;
