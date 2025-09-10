import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger.js';
import { googleSearchService } from '../search/google-search.service.js';
import { contactScraperService } from '../scraper/contact-scraper.service.js';
import { companyService } from './company-service.js';

export interface DiscoveryResult {
  companyName: string;
  website: string;
  description: string;
  industry: string;
  emails: string[];
  phones: string[];
  addresses: string[];
  contactPerson?: string;
  contactPosition?: string;
  source: 'google_search' | 'manual';
  discoveredAt: Date;
}

export class CompanyDiscoveryService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Discover companies in specific industry
   */
  async discoverCompaniesByIndustry(
    industry: string, 
    location: string = 'Slovakia',
    maxCompanies: number = 20
  ): Promise<DiscoveryResult[]> {
    try {
      logger.info('Starting company discovery', {
        industry,
        location,
        maxCompanies,
      });

      // Step 1: Search for companies using Google Search
      const searchResults = await googleSearchService.searchCompaniesByIndustry(industry, location);
      
      logger.info('Google Search completed', {
        industry,
        companiesFound: searchResults.length,
      });

      // Step 2: Scrape contact information for each company
      const discoveryResults: DiscoveryResult[] = [];
      const websites = searchResults.map(result => result.website);

      for (let i = 0; i < Math.min(websites.length, maxCompanies); i++) {
        const website = websites[i];
        const searchResult = searchResults[i];

        try {
          logger.info(`Scraping website ${i + 1}/${Math.min(websites.length, maxCompanies)}`, {
            website,
            companyName: searchResult?.companyName || 'Unknown',
          });

          // Scrape contact information
          const contactInfo = await contactScraperService.scrapeWebsite(website || '');

          // Create discovery result
          const discoveryResult: DiscoveryResult = {
            companyName: searchResult?.companyName || 'Unknown',
            website: website || '',
            description: searchResult?.description || '',
            industry,
            emails: contactInfo.emails,
            phones: contactInfo.phones,
            addresses: contactInfo.addresses,
            contactPerson: contactInfo.contactPerson || '',
            contactPosition: contactInfo.contactPosition || '',
            source: 'google_search',
            discoveredAt: new Date(),
          };

          discoveryResults.push(discoveryResult);

          // Add delay to be respectful
          await new Promise(resolve => setTimeout(resolve, 3000));

        } catch (error) {
          logger.error('Failed to scrape website', {
            error,
            website,
            companyName: searchResult?.companyName || 'Unknown',
          });
        }
      }

      logger.info('Company discovery completed', {
        industry,
        companiesDiscovered: discoveryResults.length,
        totalEmailsFound: discoveryResults.reduce((sum, result) => sum + result.emails.length, 0),
        totalPhonesFound: discoveryResults.reduce((sum, result) => sum + result.phones.length, 0),
      });

      return discoveryResults;
    } catch (error) {
      logger.error('Company discovery failed', { error, industry, location });
      throw error;
    }
  }

  /**
   * Save discovered companies to database
   */
  async saveDiscoveredCompanies(discoveryResults: DiscoveryResult[]): Promise<{
    saved: number;
    skipped: number;
    errors: number;
  }> {
    const results = {
      saved: 0,
      skipped: 0,
      errors: 0,
    };

    for (const discovery of discoveryResults) {
      try {
        // Check if company already exists
        const existingCompany = await this.prisma.company.findFirst({
          where: {
            OR: [
              { website: discovery.website },
              { name: discovery.companyName },
            ],
          },
        });

        if (existingCompany) {
          logger.info('Company already exists, skipping', {
            companyName: discovery.companyName,
            website: discovery.website,
          });
          results.skipped++;
          continue;
        }

        // Create new company
        const company = await this.prisma.company.create({
          data: {
            name: discovery.companyName,
            website: discovery.website,
            description: discovery.description,
            industry: discovery.industry,
            email: discovery.emails[0] || null,
            phone: discovery.phones[0] || null,
            address: discovery.addresses[0] || null,
            contactName: discovery.contactPerson || null,
            contactPosition: discovery.contactPosition || null,
            contactEmail: discovery.emails[1] || null,
            contactPhone: discovery.phones[1] || null,
            source: discovery.source,
            status: 'PENDING',
          },
        });

        logger.info('Company saved to database', {
          companyId: company.id,
          companyName: company.name,
          website: company.website,
        });

        results.saved++;

      } catch (error) {
        logger.error('Failed to save company', {
          error,
          companyName: discovery.companyName,
          website: discovery.website,
        });
        results.errors++;
      }
    }

    logger.info('Company saving completed', results);
    return results;
  }

  /**
   * Full discovery pipeline
   */
  async runDiscoveryPipeline(
    industries: string[],
    location: string = 'Slovakia',
    maxCompaniesPerIndustry: number = 10
  ): Promise<{
    totalDiscovered: number;
    totalSaved: number;
    totalSkipped: number;
    totalErrors: number;
    resultsByIndustry: Record<string, DiscoveryResult[]>;
  }> {
    const pipelineResults = {
      totalDiscovered: 0,
      totalSaved: 0,
      totalSkipped: 0,
      totalErrors: 0,
      resultsByIndustry: {} as Record<string, DiscoveryResult[]>,
    };

    logger.info('Starting discovery pipeline', {
      industries,
      location,
      maxCompaniesPerIndustry,
    });

    for (const industry of industries) {
      try {
        logger.info(`Processing industry: ${industry}`);

        // Discover companies in this industry
        const discoveryResults = await this.discoverCompaniesByIndustry(
          industry,
          location,
          maxCompaniesPerIndustry
        );

        pipelineResults.resultsByIndustry[industry] = discoveryResults;
        pipelineResults.totalDiscovered += discoveryResults.length;

        // Save discovered companies
        const saveResults = await this.saveDiscoveredCompanies(discoveryResults);
        pipelineResults.totalSaved += saveResults.saved;
        pipelineResults.totalSkipped += saveResults.skipped;
        pipelineResults.totalErrors += saveResults.errors;

        logger.info(`Industry ${industry} completed`, {
          discovered: discoveryResults.length,
          saved: saveResults.saved,
          skipped: saveResults.skipped,
          errors: saveResults.errors,
        });

        // Add delay between industries
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        logger.error(`Failed to process industry: ${industry}`, { error });
        pipelineResults.totalErrors++;
      }
    }

    logger.info('Discovery pipeline completed', pipelineResults);
    return pipelineResults;
  }

  /**
   * Get discovery statistics
   */
  async getDiscoveryStats(): Promise<{
    totalCompanies: number;
    companiesByIndustry: Record<string, number>;
    companiesBySource: Record<string, number>;
    companiesByStatus: Record<string, number>;
    recentDiscoveries: number;
  }> {
    try {
      const [
        totalCompanies,
        companiesByIndustry,
        companiesBySource,
        companiesByStatus,
        recentDiscoveries,
      ] = await Promise.all([
        this.prisma.company.count(),
        this.prisma.company.groupBy({
          by: ['industry'],
          _count: { industry: true },
        }),
        this.prisma.company.groupBy({
          by: ['source'],
          _count: { source: true },
        }),
        this.prisma.company.groupBy({
          by: ['status'],
          _count: { status: true },
        }),
        this.prisma.company.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

      const stats = {
        totalCompanies,
        companiesByIndustry: {} as Record<string, number>,
        companiesBySource: {} as Record<string, number>,
        companiesByStatus: {} as Record<string, number>,
        recentDiscoveries,
      };

      companiesByIndustry.forEach(group => {
        if (group.industry) {
          stats.companiesByIndustry[group.industry] = group._count.industry;
        }
      });

      companiesBySource.forEach(group => {
        if (group.source) {
          stats.companiesBySource[group.source] = group._count.source;
        }
      });

      companiesByStatus.forEach(group => {
        stats.companiesByStatus[group.status] = group._count.status;
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get discovery stats', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const companyDiscoveryService = new CompanyDiscoveryService();
