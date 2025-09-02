// Find Text Step - Searches for text in document pages

import { PipelineStep, PipelineContext, FindTextOptions, FindTextResult } from '../../types.js';
import { PDFDocument } from '../../pdf/pdfium.js';

export class FindTextStep implements PipelineStep {
  type = 'find_text';

  async execute(context: PipelineContext): Promise<FindTextResult> {
    const currentDoc = context.variables.get('currentDoc') as PDFDocument;
    
    if (!currentDoc) {
      throw new Error('No document open');
    }

    // Get find options from context
    const options: FindTextOptions = {
      query: context.variables.get('find_text.query') as string | string[],
      region: context.variables.get('find_text.region'),
      regex: context.variables.get('find_text.regex') as string,
      caseSensitive: context.variables.get('find_text.caseSensitive') as boolean ?? false,
      wholeWords: context.variables.get('find_text.wholeWords') as boolean ?? false
    };

    if (!options.query) {
      throw new Error('Find text query is required');
    }

    const pages = await currentDoc.pages();
    const matches: FindTextResult['matches'] = [];

    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];
      const textRuns = await page.text();
      const pageSize = await page.size();

      // Search for text in this page
      const pageMatches = this.searchInPage(
        textRuns,
        pageSize,
        options,
        pageIndex
      );

      matches.push(...pageMatches);
    }

    return { matches };
  }

  private searchInPage(
    textRuns: any[],
    pageSize: { width: number; height: number },
    options: FindTextOptions,
    pageIndex: number
  ): FindTextResult['matches'] {
    const matches: FindTextResult['matches'] = [];
    const queries = Array.isArray(options.query) ? options.query : [options.query];

    for (const textRun of textRuns) {
      for (const query of queries) {
        let searchText = textRun.text;
        let queryText = query;

        // Handle case sensitivity
        if (!options.caseSensitive) {
          searchText = searchText.toLowerCase();
          queryText = queryText.toLowerCase();
        }

        // Check if text matches query
        let isMatch = false;
        if (options.wholeWords) {
          const wordRegex = new RegExp(`\\b${this.escapeRegex(queryText)}\\b`);
          isMatch = wordRegex.test(searchText);
        } else {
          isMatch = searchText.includes(queryText);
        }

        if (isMatch) {
          // Check if within region constraints
          if (options.region && !this.isInRegion(textRun, pageSize, options.region)) {
            continue;
          }

          let finalText = textRun.text;

          // Apply regex if provided
          if (options.regex) {
            const regexMatch = new RegExp(options.regex).exec(textRun.text);
            if (regexMatch) {
              finalText = regexMatch[1] || regexMatch[0];
            } else {
              continue; // Skip if regex doesn't match
            }
          }

          matches.push({
            text: finalText,
            x: textRun.x,
            y: textRun.y,
            width: textRun.width,
            height: textRun.height,
            confidence: 1.0, // Vector text is 100% confident
            pageIndex
          });
        }
      }
    }

    return matches;
  }

  private isInRegion(
    textRun: any,
    pageSize: { width: number; height: number },
    region: any
  ): boolean {
    // Calculate region bounds based on anchor
    let regionX = 0;
    let regionY = 0;
    let regionWidth = region.width;
    let regionHeight = region.height;

    // Handle relative vs absolute coordinates
    if (region.relative !== false) {
      regionWidth *= pageSize.width;
      regionHeight *= pageSize.height;
    }

    // Calculate position based on anchor
    switch (region.anchor) {
      case 'top-left':
        regionX = (region.dx || 0);
        regionY = (region.dy || 0);
        break;
      case 'top-right':
        regionX = pageSize.width - regionWidth + (region.dx || 0);
        regionY = (region.dy || 0);
        break;
      case 'bottom-left':
        regionX = (region.dx || 0);
        regionY = pageSize.height - regionHeight + (region.dy || 0);
        break;
      case 'bottom-right':
        regionX = pageSize.width - regionWidth + (region.dx || 0);
        regionY = pageSize.height - regionHeight + (region.dy || 0);
        break;
      case 'center':
        regionX = (pageSize.width - regionWidth) / 2 + (region.dx || 0);
        regionY = (pageSize.height - regionHeight) / 2 + (region.dy || 0);
        break;
    }

    // Check if text run is within region
    return (
      textRun.x >= regionX &&
      textRun.y >= regionY &&
      textRun.x + textRun.width <= regionX + regionWidth &&
      textRun.y + textRun.height <= regionY + regionHeight
    );
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}