import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../../utils/logger.js';
import { errorHandler } from '../../utils/errors.js';

export interface ContactInfo {
  emails: string[];
  phones: string[];
  addresses: string[];
  contactPerson?: string;
  contactPosition?: string;
}

export interface ScrapedCompany {
  companyName: string;
  website: string;
  contactInfo: ContactInfo;
  description?: string;
  industry?: string;
  size?: string;
}

export class ContactScraperService {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  ];

  /**
   * Scrape contact information from a website
   */
  async scrapeWebsite(url: string): Promise<ContactInfo> {
    try {
      logger.info('Scraping website for contact information', { url });

      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000,
        maxRedirects: 5,
      });

      const $ = cheerio.load(response.data);
      
      const contactInfo: ContactInfo = {
        emails: this.extractEmails($),
        phones: this.extractPhones($),
        addresses: this.extractAddresses($),
        contactPerson: this.extractContactPerson($) || '',
        contactPosition: this.extractContactPosition($) || '',
      };

      logger.info('Website scraping completed', {
        url,
        emailsFound: contactInfo.emails.length,
        phonesFound: contactInfo.phones.length,
        addressesFound: contactInfo.addresses.length,
      });

      return contactInfo;
    } catch (error) {
      logger.error('Failed to scrape website', { error, url });
      errorHandler.handleError(error as Error, {
        context: 'contact_scraper',
        url,
      });

      return {
        emails: [],
        phones: [],
        addresses: [],
      };
    }
  }

  /**
   * Extract email addresses from HTML
   */
  private extractEmails($: cheerio.CheerioAPI): string[] {
    const emails = new Set<string>();
    
    // Common email patterns
    const emailPatterns = [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      /[a-zA-Z0-9._%+-]+\s*@\s*[a-zA-Z0-9.-]+\s*\.\s*[a-zA-Z]{2,}/g,
    ];

    // Search in text content
    $('body').each((_, element) => {
      const text = $(element).text();
      emailPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(email => {
            const cleanEmail = email.replace(/\s+/g, '').toLowerCase();
            if (this.isValidEmail(cleanEmail)) {
              emails.add(cleanEmail);
            }
          });
        }
      });
    });

    // Search in href attributes
    $('a[href^="mailto:"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const email = href.replace('mailto:', '').split('?')[0];
        if (email && this.isValidEmail(email)) {
          emails.add(email.toLowerCase());
        }
      }
    });

    // Search in data attributes
    $('[data-email], [data-contact-email]').each((_, element) => {
      const email = $(element).attr('data-email') || $(element).attr('data-contact-email');
      if (email && this.isValidEmail(email)) {
        emails.add(email.toLowerCase());
      }
    });

    return Array.from(emails);
  }

  /**
   * Extract phone numbers from HTML
   */
  private extractPhones($: cheerio.CheerioAPI): string[] {
    const phones = new Set<string>();
    
    // Slovak phone patterns
    const phonePatterns = [
      /(\+421\s*[0-9]{3}\s*[0-9]{3}\s*[0-9]{3})/g,
      /([0-9]{3}\s*[0-9]{3}\s*[0-9]{3})/g,
      /([0-9]{2}\s*[0-9]{3}\s*[0-9]{3})/g,
      /(\+421\s*[0-9]{2}\s*[0-9]{3}\s*[0-9]{3})/g,
    ];

    // Search in text content
    $('body').each((_, element) => {
      const text = $(element).text();
      phonePatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(phone => {
            const cleanPhone = this.cleanPhoneNumber(phone);
            if (cleanPhone) {
              phones.add(cleanPhone);
            }
          });
        }
      });
    });

    // Search in href attributes
    $('a[href^="tel:"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const phone = href.replace('tel:', '').split('?')[0];
        const cleanPhone = this.cleanPhoneNumber(phone || '');
        if (cleanPhone) {
          phones.add(cleanPhone);
        }
      }
    });

    return Array.from(phones);
  }

  /**
   * Extract addresses from HTML
   */
  private extractAddresses($: cheerio.CheerioAPI): string[] {
    const addresses = new Set<string>();
    
    // Common address patterns
    const addressSelectors = [
      '.address',
      '.contact-address',
      '[data-address]',
      '.location',
      '.kontakt',
      '.adresa',
      'address',
    ];

    addressSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const address = $(element).text().trim();
        if (address && address.length > 10) {
          addresses.add(address);
        }
      });
    });

    // Search for address patterns in text
    const addressPatterns = [
      /([A-ZÁČĎÉÍĽĹŇÓÔŔŠŤÚÝŽ][a-záčďéíľĺňóôŕšťúýž\s]+[0-9]+[,\s]+[0-9]{5}\s+[A-ZÁČĎÉÍĽĹŇÓÔŔŠŤÚÝŽ][a-záčďéíľĺňóôŕšťúýž\s]+)/g,
    ];

    $('body').each((_, element) => {
      const text = $(element).text();
      addressPatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          matches.forEach(address => {
            const cleanAddress = address.trim();
            if (cleanAddress.length > 10) {
              addresses.add(cleanAddress);
            }
          });
        }
      });
    });

    return Array.from(addresses);
  }

  /**
   * Extract contact person name
   */
  private extractContactPerson($: cheerio.CheerioAPI): string | undefined {
    const contactSelectors = [
      '.contact-person',
      '.contact-name',
      '[data-contact-person]',
      '.kontaktna-osoba',
      '.meno',
    ];

    for (const selector of contactSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text && text.length > 2) {
          return text;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract contact person position
   */
  private extractContactPosition($: cheerio.CheerioAPI): string | undefined {
    const positionSelectors = [
      '.contact-position',
      '.position',
      '[data-position]',
      '.pozicia',
      '.funkcia',
    ];

    for (const selector of positionSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text().trim();
        if (text && text.length > 2) {
          return text;
        }
      }
    }

    return undefined;
  }

  /**
   * Clean and validate email address
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && 
           !email.includes('example.com') && 
           !email.includes('test.com') &&
           !email.includes('noreply') &&
           !email.includes('no-reply');
  }

  /**
   * Clean phone number
   */
  private cleanPhoneNumber(phone: string): string | null {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Add +421 prefix if missing
    if (cleaned.startsWith('09') && cleaned.length === 10) {
      return `+421${cleaned.substring(1)}`;
    }
    
    if (cleaned.startsWith('+421') && cleaned.length === 13) {
      return cleaned;
    }
    
    if (cleaned.length === 9 && !cleaned.startsWith('+')) {
      return `+421${cleaned}`;
    }
    
    return cleaned.length >= 9 ? cleaned : null;
  }

  /**
   * Get random user agent
   */
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)] || this.userAgents[0] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  }

  /**
   * Scrape multiple websites
   */
  async scrapeMultipleWebsites(urls: string[]): Promise<ScrapedCompany[]> {
    const results: ScrapedCompany[] = [];

    for (const url of urls) {
      try {
        const contactInfo = await this.scrapeWebsite(url);
        
        results.push({
          companyName: this.extractCompanyNameFromUrl(url),
          website: url,
          contactInfo,
        });

        // Add delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error('Failed to scrape website', { error, url });
      }
    }

    return results;
  }

  /**
   * Extract company name from URL
   */
  private extractCompanyNameFromUrl(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace(/^www\./, '').replace(/\.sk$/, '');
    } catch {
      return 'Unknown Company';
    }
  }
}

// Export singleton instance
export const contactScraperService = new ContactScraperService();
