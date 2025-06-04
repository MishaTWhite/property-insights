// cypress/integration/city_selector.spec.js

describe('City Selector Feature', () => {
  beforeEach(() => {
    // Setup mock responses for the endpoints
    cy.intercept('GET', '/api/otodom-stats/cities', {
      statusCode: 200,
      body: ['warszawa', 'krakow', 'gdansk']
    }).as('getCities');
    
    cy.intercept('GET', '/api/otodom-stats/stats*', (req) => {
      const city = req.query.city;
      const response = {
        city: city,
        avg_price_sqm: 15000,
        listing_count: 45,
        districts: [
          {
            district: 'test-district',
            count: 10,
            avg_ppsqm: 16000,
            rooms: {
              "1": { count: 3, avg_ppsqm: 17000 },
              "2": { count: 5, avg_ppsqm: 16000 },
              "3+": { count: 2, avg_ppsqm: 15000 }
            }
          }
        ]
      };
      req.reply({ statusCode: 200, body: response });
    }).as('getCityStats');
    
    // Visit the analyzer page
    cy.visit('/otodom-analyzer');
  });
  
  it('should load cities in the dropdown', () => {
    // Wait for cities to load
    cy.wait('@getCities');
    
    // Open the dropdown
    cy.get('[data-testid=city-selector]').click();
    
    // Check if cities are in the dropdown
    cy.get('[data-testid=city-option-warszawa]').should('be.visible');
    cy.get('[data-testid=city-option-krakow]').should('be.visible');
    cy.get('[data-testid=city-option-gdansk]').should('be.visible');
  });
  
  it('should load stats when city is selected', () => {
    // Wait for cities to load
    cy.wait('@getCities');
    
    // Open the dropdown
    cy.get('[data-testid=city-selector]').click();
    
    // Select a city
    cy.get('[data-testid=city-option-krakow]').click();
    
    // Wait for stats to load
    cy.wait('@getCityStats');
    
    // Check if city name is displayed
    cy.contains('krakow').should('be.visible');
    
    // Check if listing count is displayed
    cy.contains('Listings: 45').should('be.visible');
    
    // Check if average price is displayed
    cy.contains('Avg Price/m²: 15000 zł').should('be.visible');
    
    // Check if district table has data
    cy.contains('test-district').should('be.visible');
  });
  
  it('should switch between cities', () => {
    // Wait for cities to load
    cy.wait('@getCities');
    
    // Select first city
    cy.get('[data-testid=city-selector]').click();
    cy.get('[data-testid=city-option-warszawa]').click();
    
    // Wait for stats to load
    cy.wait('@getCityStats');
    
    // Check if first city is displayed
    cy.contains('warszawa').should('be.visible');
    
    // Select second city
    cy.get('[data-testid=city-selector]').click();
    cy.get('[data-testid=city-option-gdansk]').click();
    
    // Wait for stats to load
    cy.wait('@getCityStats');
    
    // Check if second city is displayed
    cy.contains('gdansk').should('be.visible');
  });
});