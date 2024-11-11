// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************
describe('POST /register', () => {


  // Positive Test Case
  it('should successfully register a new user', (done) => {
    chai.request(server)
      .post('/register')
      .send({
        fullname: 'John Doe',
        username: 'johndoe',
        password: 'password123',
        confirmPassword: 'password123'
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.redirects[0]).to.include('/register'); // Check if redirected URL includes /login
        done();
      });
  });

  // Negative Test Case
  it('should fail registration when passwords do not match', (done) => {
    chai.request(server)
      .post('/register')
      .send({
        fullname: 'Jane Doe',
        username: 'janedoe',
        password: 'password123',
        confirmPassword: 'password321' // Different password for confirmation
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.redirects[0]).to.include('/register'); // Check if redirected URL includes /register
        done();
      });
  });
});