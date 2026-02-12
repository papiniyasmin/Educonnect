const db = require('./db');

db.query('SELECT * FROM Aluno', (err, results) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(results);
});
