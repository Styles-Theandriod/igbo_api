import chai from 'chai';
import { isEqual, forIn, some } from 'lodash';
import {
  createExample,
  getExamples,
  getExample,
  updateExample,
} from './shared/commands';
import {
  LONG_TIMEOUT,
  EXAMPLE_KEYS,
  INVALID_ID,
  NONEXISTENT_ID,
} from './shared/constants';
import { expectUniqSetsOfResponses, expectArrayIsInOrder } from './shared/utils';
import {
  exampleData,
  malformedWordSuggestionData,
  updatedExampleData,
} from './__mocks__/documentData';

const { expect } = chai;

describe('MongoDB Examples', () => {
  describe('/POST mongodb examples', () => {
    it('should create a new example in the database', (done) => {
      createExample(exampleData)
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expect(res.body.id).to.not.equal(undefined);
          done();
        });
    });

    it('should throw an error for malformed new example data', (done) => {
      createExample(malformedWordSuggestionData)
        .end((_, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.not.equal(undefined);
          done();
        });
    });

    it('should return newly created example by searching with keyword', (done) => {
      createExample(exampleData)
        .then((res) => {
          expect(res.status).to.equal(200);
          expect(res.body.id).to.not.equal(undefined);
          getExamples({ keyword: exampleData.igbo })
            .end((_, result) => {
              expect(res.status).to.equal(200);
              expect(some(result.body, (example) => example.igbo === exampleData.igbo)).to.equal(true);
              done();
            });
        });
    });
  });

  describe('/PUT mongodb examples', () => {
    it('should create a new example and update it', (done) => {
      createExample(exampleData)
        .then((res) => {
          expect(res.status).to.equal(200);
          expect(res.body.id).to.not.equal(undefined);
          updateExample(res.body.id, updatedExampleData)
            .end((_, result) => {
              expect(result.status).to.equal(200);
              forIn(updatedExampleData, (value, key) => {
                expect(isEqual(result.body[key], value)).to.equal(true);
              });
              done();
            });
        });
    });
  });

  describe('/GET mongodb examples', () => {
    it('should return an example by searching', (done) => {
      getExamples()
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expect(res.body).to.have.lengthOf.at.most(10);
          done();
        });
    });

    it('should return one word', (done) => {
      getExamples()
        .then((res) => {
          getExample(res.body[0].id)
            .end((_, result) => {
              expect(result.status).to.equal(200);
              expect(result.body).to.be.an('object');
              expect(result.body).to.have.all.keys(EXAMPLE_KEYS);
              done();
            });
        });
    });

    it('should return an error for incorrect word id', (done) => {
      getExamples()
        .then(() => {
          getExample(NONEXISTENT_ID)
            .end((_, result) => {
              expect(result.status).to.equal(400);
              expect(result.error).to.not.equal(undefined);
              done();
            });
        });
    });

    it('should return an error because document doesn\'t exist', (done) => {
      getExample(INVALID_ID)
        .end((_, res) => {
          expect(res.status).to.equal(400);
          expect(res.body.error).to.not.equal(undefined);
          done();
        });
    });

    it('should return at most ten example per request with range query', function (done) {
      this.timeout(LONG_TIMEOUT);
      Promise.all([
        getExamples({ range: '[0,9]' }),
        getExamples({ range: '[10,19]' }),
        getExamples({ range: '[20,29' }),
      ]).then((res) => {
        expectUniqSetsOfResponses(res);
        done();
      });
    });

    it('should return different sets of example suggestions for pagination', (done) => {
      Promise.all([
        getExamples(0),
        getExamples(1),
        getExamples(2),
      ]).then((res) => {
        expectUniqSetsOfResponses(res);
        done();
      });
    });

    it('should return prioritize page over range', (done) => {
      Promise.all([
        getExamples({ page: '1' }),
        getExamples({ page: '1', range: '[100,109]' }),
      ]).then((res) => {
        expect(isEqual(res[0].body, res[1].body)).to.equal(true);
        done();
      });
    });

    it('should return a descending sorted list of examples with sort query', (done) => {
      const key = 'igbo';
      const direction = 'desc';
      getExamples({ sort: `["${key}": "${direction}"]` })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expectArrayIsInOrder(res.body, key, direction);
          done();
        });
    });

    it('should return a ascending sorted list of examples with sort query', (done) => {
      const key = 'english';
      const direction = 'asc';
      getExamples({ sort: `["${key}": "${direction}"]` })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expectArrayIsInOrder(res.body, key, direction);
          done();
        });
    });

    it('should return ascending sorted list of examples with malformed sort query', (done) => {
      const key = 'igbo';
      getExamples({ sort: `["${key}]` })
        .end((_, res) => {
          expect(res.status).to.equal(200);
          expectArrayIsInOrder(res.body, key);
          done();
        });
    });
  });
});
