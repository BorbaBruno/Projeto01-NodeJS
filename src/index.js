const { v4: uuidv4 } = require('uuid');
const express = require('express');

const app = express();

app.use(express.json());

const customers = [];

// Midleware

function verifyIfExistsAccountCpf(request, response, next) {
  const { cpf } = request.headers;
  const customer = customers.find(customer => customer.cpf === cpf);

  if(!customer) {
    return response.status(400).json({ error: "Customer not found" });
  }

  request.customer = customer;

  return next();

}

function getBalance(statement){
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === "Credit"){
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);
  return balance;
};

app.post('/account', (request, response) => {
  const { cpf, name } = request.body
  const customerAlreadyExists = customers.some(
    (customers) => customers.cpf === cpf
  )

  if(customerAlreadyExists) {
    return response.status(400).json({error: "Customer Already Exists!"});
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  })

  return response.status(201).send()
});

//app.use(verifyIfExistsAccountCpf);

app.get('/statement', verifyIfExistsAccountCpf, (request, response) => { 
  const { customer } = request;

  return response.json(customer.statement);
});

app.post('/deposit', verifyIfExistsAccountCpf, (request, response) => {
  const { description, amount} = request.body;
  const { customer } = request;
    const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "Credit"
  }

customer.statement.push(statementOperation)

return response.status(201).send();
}); 

app.post('/withdraw', verifyIfExistsAccountCpf, (request, response) => {
  const { amount } = request.body;
  const {customer } = request;

  const balance = getBalance(customer.statement);

  if(balance < amount){
    return response.status(400).json({error: "Insufficient funds!"});
  }
  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'Debit',
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.get('/statement/date', verifyIfExistsAccountCpf, (request, response) => { 
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString());

  return response.json(statement);
});


app.listen(3333);
