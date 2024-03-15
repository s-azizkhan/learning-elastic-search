/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client } from '@elastic/elasticsearch';

export class ElasticSearch {
  client: Client;
  constructor() {
    this.client = new Client({
      node: 'http://localhost:9200',
      auth: { username: 'elastic', password: 'qwerty' },
      requestTimeout: 1000 * 60 * 60,
    });
  }
  async getClient() {
    return this.client;
  }
  async checkConnection() {
    try {
      await this.client.ping();
      console.log('Elasticsearch cluster is up and running.');
    } catch (error) {
      console.error('Error connecting to Elasticsearch:', error);
    }
  }

  /**
   * Creates an index in Elasticsearch with the specified name and optional mappings.
   *
   * @param {string} indexName - The name of the index to create.
   * @param {any} mappings - Optional mappings for the index.
   * @return {Promise<void>} A Promise that resolves when the index is created successfully.
   */
  async createIndex(indexName: string, mappings?: any): Promise<void> {

    /*
    id: id;
    index: string;
    type?: string;
    wait_for_active_shards?: string;
    refresh?: 'wait_for' | boolean;
    routing?: string;
    timeout?: string;
    version?: number;
    version_type?: 'internal' | 'external' | 'external_gte';
    pipeline?: string;
    body: T;
    */
    try {
      const { body: indexExists } = await this.client.indices.exists({ index: indexName });

      if (!indexExists) {
        const { body: created } = await this.client.indices.create({ index: indexName, body: { mappings } });
        if (created) {
          console.log(`Index "${indexName}" created successfully.`);
        }
      } else {
        console.log(`Index "${indexName}" already exists.`);
      }
    } catch (error) {
      console.error('An error occurred while creating the index:', error);
    }
  }

  /**
   * Deletes an index.
   *
   * @param {string} index - The name of the index to be deleted.
   * @return {Promise<void>} - A promise that resolves when the index is deleted successfully.
   */
  async deleteIndex(index: string): Promise<void> {
    try {
      const { body: indexExists } = await this.client.indices.exists({ index });

      if (!indexExists) {
        console.log('Index does not exist.');
        return;
      }
      const { body } = await this.client.indices.delete({
        index
      });

      if (body.acknowledged) {
        console.log('Index deleted successfully.');
      } else {
        console.log('Index deletion failed.');
      }
    } catch (error) {
      console.error('An error occurred while deleting the index:', error);
    }
  }

  /**
   * Opens the specified index.
   *
   * @param {string} index - The name of the index to open.
   * @return {Promise<void>} - A Promise that resolves when the index is successfully opened.
   */
  async openIndex(index: string): Promise<void> {
    try {
      const { body } = await this.client.indices.open({
        index
      });

      if (body.acknowledged) {
        console.log('Index opened successfully.');
      } else {
        console.log('Index opening failed.');
      }
    } catch (error) {
      console.error('An error occurred while opening the index:', error);
    }
  }

  /**
   * Closes the specified index.
   *
   * @param {string} index - The name of the index to close.
   * @return {Promise<void>} - A promise that resolves when the index is closed successfully.
   */
  async closeIndex(index: string): Promise<void> {
    try {
      const { body } = await this.client.indices.close({
        index
      });

      if (body.acknowledged) {
        console.log('Index closed successfully.');
      } else {
        console.log('Index closing failed.');
      }
    } catch (error) {
      console.error('An error occurred while closing the index:', error);
    }
  }

  /**
   * Indexes a document in the specified index with the given id.
   *
   * @param {string} index - The name of the index where the document will be indexed.
   * @param {string} id - The id of the document.
   * @param {Record<string, any>} document - The document data to be indexed.
   * @return {Promise<void>} - A Promise that resolves when the document is indexed successfully.
   */
  async indexDocument(index: string, id: string, document: Record<string, any>): Promise<void> {
    try {
      const { body } = await this.client.index({
        index,
        id,
        body: document
      });

      if (body.result === 'created') {
        console.log('Document indexed successfully.');
      } else {
        console.log('Document was not indexed.');
      }
    } catch (error) {
      console.error('An error occurred while indexing the document:', error);
    }
  }

  /**
   * Retrieves a document from the specified index using its ID.
   *
   * @param {string} index - The name of the index where the document is stored.
   * @param {string} id - The ID of the document to retrieve.
   * @return {Promise<any>} The retrieved document, or null if an error occurred.
   */
  async getDocument(index: string, id: string): Promise<any> {
    try {
      const { body } = await this.client.get({
        index,
        id
      });

      return body._source;
    } catch (error) {
      console.error('An error occurred while retrieving the document:', error);
      return null;
    }
  }

  /**
   * Deletes a document from the specified index using the provided ID.
   *
   * @param {string} index - The index where the document is stored.
   * @param {string} id - The ID of the document to delete.
   * @return {Promise<void>} - A promise that resolves when the document is deleted successfully.
   */
  async deleteDocument(index: string, id: string): Promise<void> {
    try {
      const { body } = await this.client.delete({
        index,
        id
      });

      if (body.result === 'deleted') {
        console.log('Document deleted successfully.');
      } else {
        console.log('Document was not deleted.');
      }
    } catch (error) {
      console.error('An error occurred while deleting the document:', error);
    }
  }


  /* Search APIs */

  async searchDocuments(index: string, query: Record<string, any>): Promise<any[]> {
    try {
      const { body } = await this.client.search({
        index,
        body: query
      });

      const hits = body.hits.hits;
      return hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error('An error occurred while searching for documents:', error);
      return [];
    }
  }

  async countDocuments(index: string, query: any): Promise<number> {
    try {
      const { body } = await this.client.count({
        index,
        body: query
      });

      return body.count;
    } catch (error) {
      console.error('An error occurred while counting documents:', error);
      return 0;
    }
  }

  async scrollSearch(index: string, query: any, scrollDuration: string): Promise<any[]> {
    try {
      const { body: initialResponse } = await this.client.search({
        index,
        scroll: scrollDuration,
        body: query
      });

      const scrollId = initialResponse._scroll_id;
      const hits = initialResponse.hits.hits;

      const results: any[] = [];

      while (hits.length > 0) {
        results.push(...hits.map((hit: any) => hit._source));

        const { body: scrollResponse } = await this.client.scroll({
          scroll: scrollDuration,
          scroll_id: scrollId,
        });

        hits.length = 0;
        hits.push(...scrollResponse.hits.hits);
      }

      await this.client.clearScroll({
        body: { scroll_id: scrollId }
      });

      return results;
    } catch (error) {
      console.error('An error occurred while scrolling search:', error);
      return [];
    }
  }

  // function for nested search
  async nestedSearch(index: string, path: string, query: any): Promise<any[]> {
    try {
      const { body } = await this.client.search({
        index,
        body: {
          query: {
            nested: {
              path,
              query
            }
          }
        }
      });

      const hits = body.hits.hits;
      return hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error('An error occurred while performing nested search:', error);
      return [];
    }
  }
}