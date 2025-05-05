// Copy the entire file here and make the necessary modifications
// ...

  // Function to track tab visits
  const markTabVisited = (tab: string) => {
    console.log(`Marking tab visited: ${tab}`);
    
    // For fixed tabs (main tabs)
    const mainTabs = ["technical", "functional", "other"];
    
    // Dynamic tab handling - create standard key format for any tab
    const getTabKey = (tabName: string) => {
      // For main tabs, use the exact name
      if (mainTabs.includes(tabName.toLowerCase())) {
        return tabName.toLowerCase();
      }
      
      // For category tabs, standardize the key format
      return tabName.toLowerCase().replace(/\s+/g, '');
    };
    
    // Get the consistent tab key for state storage
    const tabKey = getTabKey(tab);
    
    console.log(`Tab mapping: "${tab}" -> "${tabKey}"`);
    
    setVisitedTabs(prev => {
      const newState = {
        ...prev,
        [tabKey]: true
      };
      console.log(`Updating tab state for ${tab} -> ${tabKey}`);
      console.log("Updated visitedTabs state:", newState);
      return newState;
    });
  };

// ...

// When rendering the technical tab triggers:
// Use the same getTabKey function as markTabVisited for consistency
const getTabKey = (tabName: string) => {
  return tabName.toLowerCase().replace(/\s+/g, '');
};

const tabId = getTabKey(category.name);

// ...

// And similarly for the functional tab triggers:
// Use the same getTabKey function as markTabVisited for consistency  
const getTabKey = (tabName: string) => {
  return tabName.toLowerCase().replace(/\s+/g, '');
};

const tabId = getTabKey(category.name);

// ...