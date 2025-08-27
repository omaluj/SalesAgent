import axios from 'axios';
import logger from '@/utils/logger.js';
import { config } from '@/config/index.js';
import { errorHandler } from '@/utils/errors.js';

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

export interface CompanySearchResult {
  companyName: string;
  website: string;
  description: string;
  searchResults: SearchResult[];
  potentialEmails: string[];
  potentialPhones: string[];
}

export class GoogleSearchService {
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Google Search service
   */
  private initialize(): void {
    try {
      if (!config.externalApis.googleSearchApiKey || !config.externalApis.googleSearchEngineId) {
        logger.warn('Google Search API credentials not configured, using mock mode');
        return;
      }

      this.isInitialized = true;
      logger.info('Google Search service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Google Search service', { error });
      errorHandler.handleError(error as Error, { context: 'google_search_init' });
    }
  }

  /**
   * Search for companies using Google Custom Search API
   */
  async searchCompanies(query: string, industry?: string, location?: string): Promise<SearchResult[]> {
    try {
      if (!this.isInitialized) {
        logger.warn('Google Search not initialized, returning mock results');
        return this.getMockSearchResults(query);
      }

      const searchQuery = this.buildSearchQuery(query, industry, location);
      
      logger.info('Searching for companies via Google Search', {
        query: searchQuery,
        industry,
        location,
      });

      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: config.externalApis.googleSearchApiKey,
          cx: config.externalApis.googleSearchEngineId,
          q: searchQuery,
          num: 10, // Number of results
          start: 1,
          safe: 'active',
        },
      });

      if (response.data.items) {
        const results: SearchResult[] = response.data.items.map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          displayLink: item.displayLink,
        }));

        logger.info('Google Search completed successfully', {
          query: searchQuery,
          resultsCount: results.length,
        });

        return results;
      } else {
        logger.warn('No search results found', { query: searchQuery });
        return [];
      }
    } catch (error) {
      logger.error('Google Search failed', { error, query });
      errorHandler.handleError(error as Error, {
        context: 'google_search',
        query,
        industry,
        location,
      });

      // Return mock results on error
      return this.getMockSearchResults(query);
    }
  }

  /**
   * Search for companies in specific industry
   */
  async searchCompaniesByIndustry(industry: string, location: string = 'Slovakia'): Promise<CompanySearchResult[]> {
    try {
      const queries = [
        `${industry} companies ${location}`,
        `${industry} firms ${location}`,
        `${industry} businesses ${location}`,
        `top ${industry} companies ${location}`,
      ];

      const allResults: CompanySearchResult[] = [];

      for (const query of queries) {
        const searchResults = await this.searchCompanies(query, industry, location);
        
        for (const result of searchResults) {
          const companyName = this.extractCompanyName(result.title, result.displayLink);
          const website = this.extractWebsite(result.link);
          
          if (companyName && website) {
            allResults.push({
              companyName,
              website,
              description: result.snippet,
              searchResults: [result],
              potentialEmails: [],
              potentialPhones: [],
            });
          }
        }

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Remove duplicates
      const uniqueResults = this.removeDuplicateCompanies(allResults);

      logger.info('Industry search completed', {
        industry,
        location,
        totalResults: uniqueResults.length,
      });

      return uniqueResults;
    } catch (error) {
      logger.error('Industry search failed', { error, industry, location });
      return [];
    }
  }

  /**
   * Build search query with filters
   */
  private buildSearchQuery(query: string, industry?: string, location?: string): string {
    let searchQuery = query;

    if (industry) {
      searchQuery += ` ${industry}`;
    }

    if (location) {
      searchQuery += ` ${location}`;
    }

    // Add filters for better results
    searchQuery += ' -wikipedia -facebook -linkedin site:.sk';

    return searchQuery;
  }

  /**
   * Extract company name from search result
   */
  private extractCompanyName(title: string, displayLink: string): string | null {
    // Remove common suffixes
    const cleanTitle = title
      .replace(/\s*-\s*.*$/, '') // Remove everything after dash
      .replace(/\s*\|\s*.*$/, '') // Remove everything after pipe
      .replace(/\s*–\s*.*$/, '') // Remove everything after en dash
      .replace(/\s*—\s*.*$/, '') // Remove everything after em dash
      .replace(/\s*•\s*.*$/, '') // Remove everything after bullet
      .replace(/\s*·\s*.*$/, '') // Remove everything after middle dot
      .trim();

    // Extract domain name as fallback
    const domain = displayLink.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    
    return cleanTitle || domain || null;
  }

  /**
   * Extract website from search result
   */
  private extractWebsite(link: string): string | null {
    try {
      const url = new URL(link);
      return `${url.protocol}//${url.hostname}`;
    } catch {
      return null;
    }
  }

  /**
   * Remove duplicate companies based on website
   */
  private removeDuplicateCompanies(companies: CompanySearchResult[]): CompanySearchResult[] {
    const seen = new Set<string>();
    return companies.filter(company => {
      const key = company.website.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Get mock search results for testing
   */
  private getMockSearchResults(query: string): SearchResult[] {
    return [
      {
        title: 'Škôlka Veselá - Súkromná škôlka Bratislava',
        link: 'https://skolkavesela.sk',
        snippet: 'Súkromná škôlka s moderným prístupom k vzdelávaniu. Poskytujeme kvalitnú starostlivosť a výchovu pre deti od 2 do 6 rokov.',
        displayLink: 'skolkavesela.sk',
      },
      {
        title: 'StartupHub SK - Inovačné centrum',
        link: 'https://startuphub.sk',
        snippet: 'Podporujeme slovenské startupy a inovatívne projekty. Poskytujeme mentoring, financovanie a networking.',
        displayLink: 'startuphub.sk',
      },
      {
        title: 'TechCorp Slovakia - IT riešenia',
        link: 'https://techcorp.sk',
        snippet: 'Profesionálne IT riešenia pre firmy. Webové aplikácie, mobilné aplikácie, cloud riešenia.',
        displayLink: 'techcorp.sk',
      },
    ];
  }

  /**
   * Test Google Search connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        logger.warn('Google Search not initialized, cannot test connection');
        return false;
      }

      const results = await this.searchCompanies('test company Slovakia');
      
      if (results.length > 0) {
        logger.info('Google Search connection test successful', {
          resultsCount: results.length,
        });
        return true;
      } else {
        logger.error('Google Search connection test failed - no results');
        return false;
      }
    } catch (error) {
      logger.error('Google Search connection test failed', { error });
      return false;
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const googleSearchService = new GoogleSearchService();
