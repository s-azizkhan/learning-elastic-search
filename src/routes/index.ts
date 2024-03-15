import { Type } from '@sinclair/typebox';
import { randomUUID } from 'crypto';
import { FastifyPluginAsync } from 'fastify';
import { ElasticSearch } from 'utils/ElasticSearch.class';

const routes: FastifyPluginAsync = async (server) => {
  server.get('/', {
    schema: {
      response: {
        200: Type.Object({
          hello: Type.String(),
        }),
      },
    },
  }, async function () {

    const elasticSearch = new ElasticSearch();
    await elasticSearch.checkConnection();

    const indexName = 'my_index';
    const mappings = {
      properties: {
        title: { type: 'text' },
        description: { type: 'text' },
        price: { type: 'float' },
        created_at: { type: 'date' }
      }
    };
    const documentId = randomUUID();
    const document = {
      title: 'Sample Document',
      description: 'This is a sample document.',
      price: 9.99,
      created_at: new Date()
    };
    const searchQuery = {
      query: {
        match: {
          title: 'sample'
        }
      }
    };


    //await elasticSearch.createIndex(indexName, mappings);
    //await elasticSearch.indexDocument(indexName, documentId, document);
    //const data = await elasticSearch.getDocument(indexName, documentId);
    //console.log('data :>> ', data);
    // Search for documents
    elasticSearch.searchDocuments(indexName, searchQuery)
      .then((searchResults) => {
        console.log('Search Results:', searchResults);
      })
      .catch((error) => {
        console.error('An error occurred:', error);
      });

    elasticSearch.countDocuments(indexName, searchQuery)
      .then((searchResults) => {
        console.log('Search Count:', searchResults);
      })
      .catch((error) => {
        console.error('An error occurred:', error);
      });
    //await elasticSearch.closeIndex(indexName);
    //await elasticSearch.openIndex(indexName);
    //await elasticSearch.deleteDocument(indexName, documentId);
    //await elasticSearch.deleteIndex(indexName);

    //const path = 'nested_field';
    //const query = {
    //  term: { 'nested_field.property': 'value' }
    //};
    //elasticSearch.nestedSearch(indexName, path, query)
    //  .then((results) => {
    //    console.log('Nested Search Results:', results);
    //  })
    //  .catch((error) => {
    //    console.error('An error occurred:', error);
    //  });

    return { hello: 'world' };
  });
}

export default routes;
