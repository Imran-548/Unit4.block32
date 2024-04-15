const pg = require("pg");
const express = require("express");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/the_acme_notes_db"
);
const app = express();

// parse the body into JS Objects
app.use(express.json());

// Log the requests as they come in
app.use(require("morgan")("dev"));

// Create falvors - C
app.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
      INSERT INTO flavors(name, is_favorite)
      VALUES($1,$2)
      RETURNING *
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

// Get flavors
app.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `
      SELECT * from flavors ORDER BY created_at DESC;
    `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

// Get flavors by id
app.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
      SELECT * from flavors WHERE id=$1 ORDER BY created_at DESC;
    `;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

// Update flavors
app.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `
      UPDATE flavors
      SET name=$1, is_favorite=$2, updated_at= now()
      WHERE id=$3 RETURNING *
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

// Delete flavors
app.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const response = await client.query("DELETE FROM flavors WHERE id = $1", [
      req.params.id,
    ]);
    res.status(204).send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

// create and run the express app

const init = async () => {
  await client.connect();
  let SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE IF NOT EXISTS flavors(
      id SERIAL PRIMARY KEY,
      name VARCHAR(254),
      is_favorite BOOLEAN,
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now()
    );
    `;
  await client.query(SQL);
  console.log("tables created");
  const table = `
    INSERT INTO flavors(name, is_favorite) VALUES('chocalate', true);
    INSERT INTO flavors(name, is_favorite) VALUES('vanilla', false);
    INSERT INTO flavors(name, is_favorite) VALUES('mango', true);
  `;
  await client.query(table);
  console.log("data seeded");
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
